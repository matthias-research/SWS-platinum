"""Windows-only reference runner. Works on copies; captures only owned windows.

This is a UI observation helper, not a filesystem/registry isolation boundary.
It terminates its owned process without normal shutdown to avoid legacy preference
writes to Windows paths. No mouse/keyboard events are sent to unrelated windows.
"""
import argparse
import ctypes as C
from ctypes import wintypes as W
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import threading
import queue
import re
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'm1' / 'native'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def owned_output(directory, name):
    output = (directory / name).resolve()
    if output.parent != directory.resolve(): raise ValueError('Output must remain inside the owned capture directory')
    return output

def prepare(game):
    target = OUT / game / 'work'
    target.mkdir(parents=True, exist_ok=True)
    exe = {'schieber': 'SchiebPl.exe', 'differ': 'DiffPl.exe'}[game]
    shutil.copy2(ROOT / 'original' / exe, target / exe)
    for folder in ['Bmp', 'Karten', 'Daten']:
        shutil.copytree(ROOT / 'original' / folder, target / folder, dirs_exist_ok=True)
    source = ROOT / 'original' / ('Schieber' if game == 'schieber' else 'Differ')
    for f in source.iterdir():
        if f.suffix.lower() in ['.jss', '.jar']:
            shutil.copy2(f, target / f.name)
    # Keep all configured asset locations inside the working copy. Audio is muted;
    # this bounded UI inspection does not need to duplicate the 330 MiB WAV set.
    ini = target / ('SCHIEBPL.INI' if game == 'schieber' else 'DIFFPL.INI')
    ini.write_text('[GLOBAL]\napppath=' + str(target) + '\\\nalternatePath=' + str(target) + '\\\n'
                   '[Sound]\nVoice=0\nCalls=0\nNoise=0\nHint=0\nIntro=0\nOwn=0\n'
                   '[Avi]\nShow=0\n', encoding='ascii')
    return target, target / exe

def setup_api():
    user = C.WinDLL('user32', use_last_error=True)
    gdi = C.WinDLL('gdi32', use_last_error=True)
    specs = {
        'GetWindowThreadProcessId': ([W.HWND, C.POINTER(W.DWORD)], W.DWORD),
        'GetWindowTextLengthW': ([W.HWND], C.c_int),
        'GetWindowTextW': ([W.HWND, W.LPWSTR, C.c_int], C.c_int),
        'GetClassNameW': ([W.HWND, W.LPWSTR, C.c_int], C.c_int),
        'IsWindowVisible': ([W.HWND], W.BOOL),
        'IsWindowEnabled': ([W.HWND], W.BOOL),
        'GetWindowRect': ([W.HWND, C.POINTER(W.RECT)], W.BOOL),
        'GetMenu': ([W.HWND], W.HMENU),
        'GetSubMenu': ([W.HMENU, C.c_int], W.HMENU),
        'GetMenuItemCount': ([W.HMENU], C.c_int),
        'GetMenuItemID': ([W.HMENU, C.c_int], W.UINT),
        'GetMenuState': ([W.HMENU, W.UINT, W.UINT], W.UINT),
        'GetMenuStringW': ([W.HMENU, W.UINT, W.LPWSTR, C.c_int, W.UINT], C.c_int),
        'GetDlgCtrlID': ([W.HWND], C.c_int),
        'PostMessageW': ([W.HWND, W.UINT, W.WPARAM, W.LPARAM], W.BOOL),
        'GetWindowDC': ([W.HWND], W.HDC),
        'ReleaseDC': ([W.HWND, W.HDC], C.c_int),
        'PrintWindow': ([W.HWND, W.HDC, W.UINT], W.BOOL),
        'SendMessageTimeoutW': ([W.HWND, W.UINT, W.WPARAM, W.LPARAM, W.UINT, W.UINT, C.POINTER(C.c_size_t)], C.c_size_t),
    }
    for name, (args, result) in specs.items():
        fn = getattr(user, name); fn.argtypes = args; fn.restype = result
    for name, args, result in [
        ('CreateCompatibleDC', [W.HDC], W.HDC),
        ('CreateCompatibleBitmap', [W.HDC, C.c_int, C.c_int], W.HBITMAP),
        ('SelectObject', [W.HDC, W.HGDIOBJ], W.HGDIOBJ),
        ('DeleteObject', [W.HGDIOBJ], W.BOOL),
        ('DeleteDC', [W.HDC], W.BOOL),
        ('GetDIBits', [W.HDC, W.HBITMAP, W.UINT, W.UINT, C.c_void_p, C.c_void_p, W.UINT], C.c_int),
    ]:
        fn = getattr(gdi, name); fn.argtypes = args; fn.restype = result
    return user, gdi

def inspect(user, process_id):
    callback = C.WINFUNCTYPE(W.BOOL, W.HWND, W.LPARAM)
    def text(hwnd):
        buf = C.create_unicode_buffer(user.GetWindowTextLengthW(hwnd) + 1)
        user.GetWindowTextW(hwnd, buf, len(buf)); return buf.value
    def node(hwnd):
        buf = C.create_unicode_buffer(256); user.GetClassNameW(hwnd, buf, 256)
        rect = W.RECT(); user.GetWindowRect(hwnd, C.byref(rect))
        return {'hwnd': int(hwnd), 'class': buf.value, 'text': text(hwnd),
                'visible': bool(user.IsWindowVisible(hwnd)), 'enabled': bool(user.IsWindowEnabled(hwnd)),
                'controlId': user.GetDlgCtrlID(hwnd), 'rect': [rect.left, rect.top, rect.right, rect.bottom]}
    def menu(hmenu):
        values = []
        if not hmenu: return values
        for i in range(user.GetMenuItemCount(hmenu)):
            buf = C.create_unicode_buffer(512); user.GetMenuStringW(hmenu, i, buf, 512, 0x400)
            values.append({'text': buf.value, 'id': user.GetMenuItemID(hmenu, i),
                           'state': user.GetMenuState(hmenu, i, 0x400), 'children': menu(user.GetSubMenu(hmenu, i))})
        return values
    result = []
    @callback
    def top(hwnd, _):
        pid = W.DWORD(); user.GetWindowThreadProcessId(hwnd, C.byref(pid))
        if pid.value == process_id:
            n = node(hwnd); n['children'] = []; n['menu'] = menu(user.GetMenu(hwnd))
            @callback
            def child(handle, _):
                n['children'].append(node(handle)); return True
            user.EnumChildWindows(hwnd, child, 0); result.append(n)
        return True
    user.EnumWindows(top, 0)
    return result

def capture_pixels(user, gdi, hwnd, path):
    from PIL import Image
    rect = W.RECT(); user.GetWindowRect(hwnd, C.byref(rect))
    width, height = rect.right - rect.left, rect.bottom - rect.top
    if not (0 < width <= 6000 and 0 < height <= 4000): return {'status': 'invalid-size'}
    dc = user.GetWindowDC(hwnd); mem = gdi.CreateCompatibleDC(dc)
    bitmap = gdi.CreateCompatibleBitmap(dc, width, height); old = gdi.SelectObject(mem, bitmap)
    class Header(C.Structure):
        _fields_ = [('size', W.DWORD), ('width', W.LONG), ('height', W.LONG), ('planes', W.WORD),
                    ('bits', W.WORD), ('compression', W.DWORD), ('imageSize', W.DWORD), ('xppm', W.LONG),
                    ('yppm', W.LONG), ('used', W.DWORD), ('important', W.DWORD)]
    try:
        painted = bool(user.PrintWindow(hwnd, mem, 0))
        gdi.SelectObject(mem, old)
        header = Header(40, width, -height, 1, 32, 0, width * height * 4, 0, 0, 0, 0)
        buf = C.create_string_buffer(width * height * 4)
        rows = gdi.GetDIBits(mem, bitmap, 0, height, buf, C.byref(header), 0)
        if rows != height: return {'status': 'capture-failed', 'rows': rows, 'painted': painted}
        Image.frombuffer('RGB', (width, height), buf.raw, 'raw', 'BGRX', 0, 1).save(path)
        return {'status': 'captured', 'painted': painted, 'path': path.relative_to(ROOT).as_posix(),
                'dimensions': [width, height], 'sha256': sha(path)}
    finally:
        gdi.DeleteObject(bitmap); gdi.DeleteDC(mem); user.ReleaseDC(hwnd, dc)

def capture(user, gdi, hwnd, path):
    results = queue.Queue()
    def work():
        try: results.put(capture_pixels(user, gdi, hwnd, path))
        except Exception as e: results.put({'status': 'capture-error', 'error': str(e)})
    # PrintWindow is synchronous and can hang on an inactive VCL form. Never
    # allow capture to prevent process cleanup; terminate the owner on completion.
    thread = threading.Thread(target=work, daemon=True)
    thread.start()
    try: return results.get(timeout=3)
    except queue.Empty: return {'status': 'capture-timeout', 'timeoutSeconds': 3}

def main():
    args = argparse.ArgumentParser()
    args.add_argument('game', choices=['schieber', 'differ'])
    args.add_argument('--command', type=int, action='append', default=[])
    args.add_argument('--file', help='Saved fixture basename inside working copy')
    args.add_argument('--label', default='startup')
    args.add_argument('--settle', type=float, default=3)
    args.add_argument('--profile', action='store_true', help='Fill initial profile with neutral test data; normal shutdown is suppressed')
    args.add_argument('--setup', choices=['cancel', 'start', 'rules'], help='Interact with the initial new-game dialog')
    opts = args.parse_args()
    if os.name != 'nt': raise SystemExit('Windows is required')
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', opts.label): raise ValueError('Label must be a filename-safe slug')
    target, exe = prepare(opts.game)
    user, gdi = setup_api()
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0  # SW_HIDE; no unsolicited visible app window.
    command = [str(exe)]
    if opts.file:
        fixture = (target / opts.file).resolve()
        if fixture.parent != target.resolve() or not fixture.is_file(): raise ValueError('Fixture must be a copied file inside the working directory')
        command.append(str(fixture))
    record = {'game': opts.game, 'capturedAtUtc': datetime.now(timezone.utc).isoformat(),
              'executable': str(exe.relative_to(ROOT)), 'sha256': sha(exe),
              'source': 'original/' + exe.name, 'method': 'Windows owned-process UI messages and PrintWindow',
              'launchVisibility': 'SW_HIDE (VCL may show its own windows)', 'commands': opts.command, 'fixture': opts.file,
              'testProfile': 'M1 Reference' if opts.profile else None, 'setupAction': opts.setup,
              'limitations': ['No general filesystem/registry isolation; avoids normal exit-time preference writes.',
                              'Audio assets omitted; audio behavior is not tested.',
                              'Hidden windows may not paint; screenshots require visual inspection.'], 'steps': []}
    process = subprocess.Popen(command, cwd=target, startupinfo=startup)
    try:
        time.sleep(opts.settle)
        if opts.profile:
            windows = inspect(user, process.pid)
            profile = next((w for w in windows if w['class'] == 'TProfileDlg' and w['visible']), None)
            if profile:
                for control in profile['children']:
                    if control['class'] == 'TEdit':
                        value = C.create_unicode_buffer('M1 Reference')
                        response = C.c_size_t()
                        user.SendMessageTimeoutW(control['hwnd'], 0xC, 0, C.cast(value, C.c_void_p).value, 2, 2000, C.byref(response))
                okay = next(c for c in profile['children'] if c['class'] == 'TBitBtn' and c['text'] == 'OK')
                user.PostMessageW(okay['hwnd'], 0xF5, 0, 0)
                time.sleep(1)
        if opts.setup:
            setup = next((w for w in inspect(user, process.pid) if w['class'] == 'TDlgNewJass' and w['visible']), None)
            if not setup: raise RuntimeError('No visible new-game dialog')
            caption = {'cancel': 'Cancel', 'start': 'OK', 'rules': 'Regeln...'}[opts.setup]
            button = next(c for c in setup['children'] if c['text'] == caption and c['enabled'])
            user.PostMessageW(button['hwnd'], 0xF5, 0, 0)
            time.sleep(2)
        for index, action in enumerate([None] + opts.command):
            windows = inspect(user, process.pid)
            if action is not None:
                main = next((w for w in windows if w['class'].lower() == 'tmainform'), None)
                if not main: raise RuntimeError('No owned main window for command')
                if not main['enabled']: raise RuntimeError('Main window is disabled by a modal dialog; refusing command injection')
                def find_item(items):
                    for item in items:
                        if item['id'] == action: return item
                        nested = find_item(item['children'])
                        if nested: return nested
                item = find_item(main['menu'])
                if not item or item['state'] & 3: raise RuntimeError('Menu command is absent or disabled')
                user.PostMessageW(main['hwnd'], 0x111, action, 0)
                time.sleep(1)
                windows = inspect(user, process.pid)
            for w in windows:
                if w['visible'] and (w['class'].startswith('T') and w['class'] != 'TApplication' or w['class'] == '#32770') and w['rect'][2] > w['rect'][0]:
                    class_slug = re.sub(r'[^A-Za-z0-9_-]', '', w['class'])
                    file = owned_output(target.parent, f'{opts.label}-{index}-{class_slug}.png')
                    w['capture'] = capture(user, gdi, w['hwnd'], file)
            record['steps'].append({'action': action, 'exitCode': process.poll(), 'windows': windows})
    except Exception as error:
        record['error'] = str(error)
        raise
    finally:
        termination_requested = process.poll() is None
        cleanup_errors = []
        try:
            if termination_requested:
                process.terminate(); process.wait(timeout=5)
        except Exception as error:
            cleanup_errors.append(str(error))
            try:
                process.kill(); process.wait(timeout=5)
            except Exception as fallback_error:
                cleanup_errors.append(str(fallback_error))
        record['cleanup'] = {'ownedProcessStopped': process.poll() is not None,
                             'terminationRequested': termination_requested, 'exitCode': process.returncode,
                             'errors': cleanup_errors}
        report = owned_output(target.parent, f'{opts.label}.json')
        report.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf8')
        print(report.relative_to(ROOT).as_posix())
        for step in record['steps']:
            print(json.dumps({'action': step['action'], 'exitCode': step['exitCode'],
                'windows': [{'class': w['class'], 'text': w['text'], 'visible': w['visible'],
                            'capture': w.get('capture')} for w in step['windows'] if w.get('capture')]}, ensure_ascii=False))

if __name__ == '__main__': main()
