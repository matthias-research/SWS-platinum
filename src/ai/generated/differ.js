// Generated from the original Pascal with pas2js 3.2.0. See docs/ai-port.md.
export function createPascalRuntime() {
﻿var pas = { $libimports: {}};

var rtl = {

  version: 30200,

  quiet: false,
  debug_load_units: false,
  debug_rtti: false,

  $res : {},

  debug: function(){
    if (rtl.quiet || !console || !console.log) return;
    console.log(arguments);
  },

  error: function(s){
    rtl.debug('Error: ',s);
    throw s;
  },

  warn: function(s){
    rtl.debug('Warn: ',s);
  },

  checkVersion: function(v){
    if (rtl.version != v) throw "expected rtl version "+v+", but found "+rtl.version;
  },

  hiInt: Math.pow(2,53),

  hasString: function(s){
    return rtl.isString(s) && (s.length>0);
  },

  isArray: function(a) {
    return Array.isArray(a);
  },

  isFunction: function(f){
    return typeof(f)==="function";
  },

  isModule: function(m){
    return rtl.isObject(m) && rtl.hasString(m.$name) && (pas[m.$name]===m);
  },

  isImplementation: function(m){
    return rtl.isObject(m) && rtl.isModule(m.$module) && (m.$module.$impl===m);
  },

  isNumber: function(n){
    return typeof(n)==="number";
  },

  isObject: function(o){
    var s=typeof(o);
    return (typeof(o)==="object") && (o!=null);
  },

  isString: function(s){
    return typeof(s)==="string";
  },

  getNumber: function(n){
    return typeof(n)==="number"?n:NaN;
  },

  getChar: function(c){
    return ((typeof(c)==="string") && (c.length===1)) ? c : "";
  },

  getObject: function(o){
    return ((typeof(o)==="object") || (typeof(o)==='function')) ? o : null;
  },

  isTRecord: function(type){
    return (rtl.isObject(type) && type.hasOwnProperty('$new') && (typeof(type.$new)==='function'));
  },

  isPasClass: function(type){
    return (rtl.isObject(type) && type.hasOwnProperty('$classname') && rtl.isObject(type.$module));
  },

  isPasClassInstance: function(type){
    return (rtl.isObject(type) && rtl.isPasClass(type.$class));
  },

  hexStr: function(n,digits){
    return ("000000000000000"+n.toString(16).toUpperCase()).slice(-digits);
  },

  m_loading: 0,
  m_loading_intf: 1,
  m_intf_loaded: 2,
  m_loading_impl: 3, // loading all used unit
  m_initializing: 4, // running initialization
  m_initialized: 5,

  module: function(module_name, intfuseslist, intfcode, impluseslist){
    if (rtl.debug_load_units) rtl.debug('rtl.module name="'+module_name+'" intfuses='+intfuseslist+' impluses='+impluseslist);
    if (!rtl.hasString(module_name)) rtl.error('invalid module name "'+module_name+'"');
    if (!rtl.isArray(intfuseslist)) rtl.error('invalid interface useslist of "'+module_name+'"');
    if (!rtl.isFunction(intfcode)) rtl.error('invalid interface code of "'+module_name+'"');
    if (!(impluseslist==undefined) && !rtl.isArray(impluseslist)) rtl.error('invalid implementation useslist of "'+module_name+'"');

    if (pas[module_name])
      rtl.error('module "'+module_name+'" is already registered');

    var r = Object.create(rtl.tSectionRTTI);
    var module = r.$module = pas[module_name] = {
      $name: module_name,
      $intfuseslist: intfuseslist,
      $impluseslist: impluseslist,
      $state: rtl.m_loading,
      $intfcode: intfcode,
      $implcode: null,
      $impl: null,
      $rtti: r
    };
    if (impluseslist) module.$impl = {
          $module: module,
          $rtti: r
        };
  },

  exitcode: 0,

  run: function(module_name){
    try {
      if (!rtl.hasString(module_name)) module_name='program';
      if (rtl.debug_load_units) rtl.debug('rtl.run module="'+module_name+'"');
      rtl.initRTTI();
      var module = pas[module_name];
      if (!module) rtl.error('rtl.run module "'+module_name+'" missing');
      rtl.loadintf(module);
      rtl.loadimpl(module);
      if ((module_name=='program') || (module_name=='library')){
        if (rtl.debug_load_units) rtl.debug('running $main');
        var r = pas[module_name].$main();
        if (rtl.isNumber(r)) rtl.exitcode = r;
      }
    } catch(re) {
      if (!rtl.showUncaughtExceptions) {
        throw re
      } else {  
        if (!rtl.handleUncaughtException(re)) {
          rtl.showException(re);
          rtl.exitcode = 216;
        }  
      }
    } 
    return rtl.exitcode;
  },
  
  showException : function (re) {
    var errStack="";
    if (rtl.isObject(re) && re.hasOwnProperty('FJSError') && rtl.isObject(re.FJSError) && !(re.FJSError.stack==undefined)) // rtl Exception
      errStack=re.FJSError.stack
    else if (rtl.isObject(re) && re.hasOwnProperty('stack') && !(re.stack==undefined)) // native JS Error
      errStack=re.stack
    else
      errStack=re; // unknown object
    var errMsg = rtl.hasString(re.$classname) ? re.$classname : '';
    errMsg += ((errMsg) ? ': ' : '') + (re.hasOwnProperty('fMessage') ? re.fMessage : '');
    errMsg += ((errMsg) ? "\n" : '') + errStack;
    errMsg = "Uncaught Exception:\n" + errMsg;
    console.log(errMsg);
    alert(errMsg);
  },

  handleUncaughtException: function (e) {
    if (rtl.onUncaughtException) {
      try {
        rtl.onUncaughtException(e);
        return true;
      } catch (ee) {
        return false; 
      }
    } else {
      return false;
    }
  },

  loadintf: function(module){
    if (module.$state>rtl.m_loading_intf) return; // already finished
    if (rtl.debug_load_units) rtl.debug('loadintf: "'+module.$name+'"');
    if (module.$state===rtl.m_loading_intf)
      rtl.error('unit cycle detected "'+module.$name+'"');
    module.$state=rtl.m_loading_intf;
    // load interfaces of interface useslist
    rtl.loaduseslist(module,module.$intfuseslist,rtl.loadintf);
    // run interface
    if (rtl.debug_load_units) rtl.debug('loadintf: run intf of "'+module.$name+'"');
    module.$intfcode(module.$intfuseslist);
    // success
    module.$state=rtl.m_intf_loaded;
    // Note: units only used in implementations are not yet loaded (not even their interfaces)
  },

  loaduseslist: function(module,useslist,f){
    if (useslist==undefined) return;
    var len = useslist.length;
    for (var i = 0; i<len; i++) {
      var unitname=useslist[i];
      if (rtl.debug_load_units) rtl.debug('loaduseslist of "'+module.$name+'" uses="'+unitname+'"');
      if (pas[unitname]==undefined)
        rtl.error('module "'+module.$name+'" misses "'+unitname+'"');
      f(pas[unitname]);
    }
  },

  loadimpl: function(module){
    if (module.$state>=rtl.m_loading_impl) return; // already processing
    if (module.$state<rtl.m_intf_loaded) rtl.error('loadimpl: interface not loaded of "'+module.$name+'"');
    if (rtl.debug_load_units) rtl.debug('loadimpl: load uses of "'+module.$name+'"');
    module.$state=rtl.m_loading_impl;
    // load interfaces of implementation useslist
    rtl.loaduseslist(module,module.$impluseslist,rtl.loadintf);
    // load implementation of interfaces useslist
    rtl.loaduseslist(module,module.$intfuseslist,rtl.loadimpl);
    // load implementation of implementation useslist
    rtl.loaduseslist(module,module.$impluseslist,rtl.loadimpl);
    // Note: At this point all interfaces used by this unit are loaded. If
    //   there are implementation uses cycles some used units might not yet be
    //   initialized. This is by design.
    // run implementation
    if (rtl.debug_load_units) rtl.debug('loadimpl: run impl of "'+module.$name+'"');
    if (rtl.isFunction(module.$implcode)) module.$implcode(module.$impluseslist);
    // run initialization
    if (rtl.debug_load_units) rtl.debug('loadimpl: run init of "'+module.$name+'"');
    module.$state=rtl.m_initializing;
    if (rtl.isFunction(module.$init)) module.$init();
    // unit initialized
    module.$state=rtl.m_initialized;
  },

  createCallback: function(scope, fn){
    var cb;
    if (typeof(fn)==='string'){
      if (!scope.hasOwnProperty('$events')) scope.$events = {};
      cb = scope.$events[fn];
      if (cb) return cb;
      scope.$events[fn] = cb = function(){
        return scope[fn].apply(scope,arguments);
      };
    } else {
      cb = function(){
        return fn.apply(scope,arguments);
      };
    };
    cb.scope = scope;
    cb.fn = fn;
    return cb;
  },

  createSafeCallback: function(scope, fn){
    var cb;
    if (typeof(fn)==='string'){
      if (!scope[fn]) return null;
      if (!scope.hasOwnProperty('$events')) scope.$events = {};
      cb = scope.$events[fn];
      if (cb) return cb;
      scope.$events[fn] = cb = function(){
        try{
          return scope[fn].apply(scope,arguments);
        } catch (err) {
          if (!rtl.handleUncaughtException(err)) throw err;
        }
      };
    } else if(!fn) {
      return null;
    } else {
      cb = function(){
        try{
          return fn.apply(scope,arguments);
        } catch (err) {
          if (!rtl.handleUncaughtException(err)) throw err;
        }
      };
    };
    cb.scope = scope;
    cb.fn = fn;
    return cb;
  },

  eqCallback: function(a,b){
    // can be a function or a function wrapper
    if (a===b){
      return true;
    } else {
      return (a!=null) && (b!=null) && (a.fn) && (a.scope===b.scope) && (a.fn===b.fn);
    }
  },

  initStruct: function(c,parent,name){
    if ((parent.$module) && (parent.$module.$impl===parent)) parent=parent.$module;
    c.$parent = parent;
    if (rtl.isModule(parent)){
      c.$module = parent;
      c.$name = name;
    } else {
      c.$module = parent.$module;
      c.$name = parent.$name+'.'+name;
    };
    return parent;
  },

  initClass: function(c,parent,name,initfn,rttiname){
    parent[name] = c;
    c.$class = c; // Note: o.$class === Object.getPrototypeOf(o)
    c.$classname = rttiname?rttiname:name;
    parent = rtl.initStruct(c,parent,name);
    c.$fullname = parent.$name+'.'+name;
    // rtti
    if (rtl.debug_rtti) rtl.debug('initClass '+c.$fullname);
    var t = c.$module.$rtti.$Class(c.$classname,{ "class": c });
    c.$rtti = t;
    if (rtl.isObject(c.$ancestor)) t.ancestor = c.$ancestor.$rtti;
    if (!t.ancestor) t.ancestor = null;
    // init members
    initfn.call(c);
  },

  createClass: function(parent,name,ancestor,initfn,rttiname){
    // create a normal class,
    // ancestor must be null or a normal class,
    // the root ancestor can be an external class
    var c = null;
    if (ancestor != null){
      c = Object.create(ancestor);
      c.$ancestor = ancestor;
      // Note:
      // if root is an "object" then c.$ancestor === Object.getPrototypeOf(c)
      // if root is a "function" then c.$ancestor === c.__proto__, Object.getPrototypeOf(c) returns the root
    } else {
      c = { $ancestor: null };
      c.$create = function(fn,args){
        if (args == undefined) args = [];
        var o = Object.create(this);
        o.$init();
        try{
          if (typeof(fn)==="string"){
            o[fn].apply(o,args);
          } else {
            fn.apply(o,args);
          };
          o.AfterConstruction();
        } catch($e){
          // do not call BeforeDestruction
          if (o.Destroy) o.Destroy();
          o.$final();
          throw $e;
        }
        return o;
      };
      c.$destroy = function(fnname){
        this.BeforeDestruction();
        if (this[fnname]) this[fnname]();
        this.$final();
      };
    };
    rtl.initClass(c,parent,name,initfn,rttiname);
  },

  createClassExt: function(parent,name,ancestor,newinstancefnname,initfn,rttiname){
    // Create a class using an external ancestor.
    // If newinstancefnname is given, use that function to create the new object.
    // If exist call BeforeDestruction and AfterConstruction.
    var isFunc = rtl.isFunction(ancestor);
    var c = null;
    if (isFunc){
      // create pascal class descendent from JS function
      c = Object.create(ancestor.prototype);
      c.$ancestorfunc = ancestor;
      c.$ancestor = null; // no pascal ancestor
    } else if (ancestor.$func){
      // create pascal class descendent from a pascal class descendent of a JS function
      isFunc = true;
      c = Object.create(ancestor);
      c.$ancestor = ancestor;
    } else {
      c = Object.create(ancestor);
      c.$ancestor = null; // no pascal ancestor
    }
    c.$create = function(fn,args){
      if (args == undefined) args = [];
      var o = null;
      if (newinstancefnname.length>0){
        o = this[newinstancefnname](fn,args);
      } else if(isFunc) {
        o = new this.$func(args);
      } else {
        o = Object.create(c);
      }
      if (o.$init) o.$init();
      try{
        if (typeof(fn)==="string"){
          this[fn].apply(o,args);
        } else {
          fn.apply(o,args);
        };
        if (o.AfterConstruction) o.AfterConstruction();
      } catch($e){
        // do not call BeforeDestruction
        if (o.Destroy) o.Destroy();
        if (o.$final) o.$final();
        throw $e;
      }
      return o;
    };
    c.$destroy = function(fnname){
      if (this.BeforeDestruction) this.BeforeDestruction();
      if (this[fnname]) this[fnname]();
      if (this.$final) this.$final();
    };
    rtl.initClass(c,parent,name,initfn,rttiname);
    if (isFunc){
      function f(){}
      f.prototype = c;
      c.$func = f;
    }
  },

  createHelper: function(parent,name,ancestor,initfn,rttiname){
    // create a helper,
    // ancestor must be null or a helper,
    var c = null;
    if (ancestor != null){
      c = Object.create(ancestor);
      c.$ancestor = ancestor;
      // c.$ancestor === Object.getPrototypeOf(c)
    } else {
      c = { $ancestor: null };
    };
    parent[name] = c;
    c.$class = c; // Note: o.$class === Object.getPrototypeOf(o)
    c.$classname = rttiname?rttiname:name;
    parent = rtl.initStruct(c,parent,name);
    c.$fullname = parent.$name+'.'+name;
    // rtti
    var t = c.$module.$rtti.$Helper(c.$classname,{ "helper": c });
    c.$rtti = t;
    if (rtl.isObject(ancestor)) t.ancestor = ancestor.$rtti;
    if (!t.ancestor) t.ancestor = null;
    // init members
    initfn.call(c);
  },

  tObjectDestroy: "Destroy",

  free: function(obj,name){
    if (obj[name]==null) return null;
    obj[name].$destroy(rtl.tObjectDestroy);
    obj[name]=null;
  },

  freeLoc: function(obj){
    if (obj==null) return null;
    obj.$destroy(rtl.tObjectDestroy);
    return null;
  },

  hideProp: function(o,p,v){
    Object.defineProperty(o,p, {
      enumerable: false,
      configurable: true,
      writable: true
    });
    if(arguments.length>2){ o[p]=v; }
  },

  recNewT: function(parent,name,initfn,full){
    // create new record type
    var t = {};
    if (parent) parent[name] = t;
    var h = rtl.hideProp;
    if (full){
      rtl.initStruct(t,parent,name);
      t.$record = t;
      h(t,'$record');
      h(t,'$name');
      h(t,'$parent');
      h(t,'$module');
      h(t,'$initSpec');
    }
    initfn.call(t);
    if (!t.$new){
      t.$new = function(){ return Object.create(t); };
    }
    t.$clone = function(r){ return t.$new().$assign(r); };
    h(t,'$new');
    h(t,'$clone');
    h(t,'$eq');
    h(t,'$assign');
    return t;
  },

  is: function(instance,type){
    return type.isPrototypeOf(instance) || (instance===type);
  },

  isExt: function(instance,type,mode){
    // mode===1 means instance must be a Pascal class instance
    // mode===2 means instance must be a Pascal class
    // Notes:
    // isPrototypeOf and instanceof return false on equal
    // isPrototypeOf does not work for Date.isPrototypeOf(new Date())
    //   so if isPrototypeOf is false test with instanceof
    // instanceof needs a function on right side
    if (instance == null) return false; // Note: ==null checks for undefined too
    if ((typeof(type) !== 'object') && (typeof(type) !== 'function')) return false;
    if (instance === type){
      if (mode===1) return false;
      if (mode===2) return rtl.isPasClass(instance);
      return true;
    }
    if (type.isPrototypeOf && type.isPrototypeOf(instance)){
      if (mode===1) return rtl.isPasClassInstance(instance);
      if (mode===2) return rtl.isPasClass(instance);
      return true;
    }
    if ((typeof type == 'function') && (instance instanceof type)) return true;
    return false;
  },

  Exception: null,
  EInvalidCast: null,
  EAbstractError: null,
  ERangeError: null,
  EIntOverflow: null,
  EPropWriteOnly: null,

  raiseE: function(typename){
    var t = rtl[typename];
    if (t==null){
      var mod = pas.SysUtils;
      if (!mod) mod = pas.sysutils;
      if (!mod) mod = pas["System.SysUtils"];
      if (mod){
        t = mod[typename];
        if (!t) t = mod[typename.toLowerCase()];
        if (!t) t = mod['Exception'];
        if (!t) t = mod['exception'];
      }
      if (t) rtl[typename]=t;
    }
    if (t) {
      
      if (t.Create){
        var e = t.$create("Create");
      } else if (t.create) {
        var e = t.$create("create");
      }
      if (e) {
        e.FJSError = new Error;
        throw e ;
      }
    }
    if (typename === "EInvalidCast") throw new Error("invalid type cast");
    if (typename === "EAbstractError") throw new Error("Abstract method called");
    if (typename === "ERangeError") throw new Error("range error");
    throw typename;
  },

  as: function(instance,type){
    if((instance === null) || rtl.is(instance,type)) return instance;
    rtl.raiseE("EInvalidCast");
  },

  asExt: function(instance,type,mode){
    if((instance === null) || rtl.isExt(instance,type,mode)) return instance;
    rtl.raiseE("EInvalidCast");
  },

  createInterface: function(module, name, guid, fnnames, ancestor, initfn, rttiname){
    //console.log('createInterface name="'+name+'" guid="'+guid+'" names='+fnnames);
    var i = ancestor?Object.create(ancestor):{};
    module[name] = i;
    i.$module = module;
    i.$name = rttiname?rttiname:name;
    i.$fullname = module.$name+'.'+i.$name;
    i.$guid = guid;
    i.$guidr = null;
    i.$names = fnnames?fnnames:[];
    if (rtl.isFunction(initfn)){
      // rtti
      if (rtl.debug_rtti) rtl.debug('createInterface '+i.$fullname);
      var t = i.$module.$rtti.$Interface(i.$name,{ "interface": i, module: module });
      i.$rtti = t;
      if (ancestor) t.ancestor = ancestor.$rtti;
      if (!t.ancestor) t.ancestor = null;
      initfn.call(i);
    }
    return i;
  },

  strToGUIDR: function(s,g){
    var p = 0;
    function n(l){
      var h = s.substr(p,l);
      p+=l;
      return parseInt(h,16);
    }
    p+=1; // skip {
    g.D1 = n(8);
    p+=1; // skip -
    g.D2 = n(4);
    p+=1; // skip -
    g.D3 = n(4);
    p+=1; // skip -
    if (!g.D4) g.D4=[];
    g.D4[0] = n(2);
    g.D4[1] = n(2);
    p+=1; // skip -
    for(var i=2; i<8; i++) g.D4[i] = n(2);
    return g;
  },

  guidrToStr: function(g){
    if (g.$intf) return g.$intf.$guid;
    var h = rtl.hexStr;
    var s='{'+h(g.D1,8)+'-'+h(g.D2,4)+'-'+h(g.D3,4)+'-'+h(g.D4[0],2)+h(g.D4[1],2)+'-';
    for (var i=2; i<8; i++) s+=h(g.D4[i],2);
    s+='}';
    return s;
  },

  createTGUID: function(guid){
    var TGuid = (pas.System)?pas.System.TGuid:pas.system.tguid;
    var g = rtl.strToGUIDR(guid,TGuid.$new());
    return g;
  },

  getIntfGUIDR: function(intfTypeOrVar){
    if (!intfTypeOrVar) return null;
    if (!intfTypeOrVar.$guidr){
      var g = rtl.createTGUID(intfTypeOrVar.$guid);
      if (!intfTypeOrVar.hasOwnProperty('$guid')) intfTypeOrVar = Object.getPrototypeOf(intfTypeOrVar);
      g.$intf = intfTypeOrVar;
      intfTypeOrVar.$guidr = g;
    }
    return intfTypeOrVar.$guidr;
  },

  addIntf: function (aclass, intf, map){
    function jmp(fn){
      if (typeof(fn)==="function"){
        return function(){ return fn.apply(this.$o,arguments); };
      } else {
        return function(){ rtl.raiseE('EAbstractError'); };
      }
    }
    if(!map) map = {};
    var t = intf;
    var item = Object.create(t);
    if (!aclass.hasOwnProperty('$intfmaps')) aclass.$intfmaps = {};
    aclass.$intfmaps[intf.$guid] = item;
    do{
      var names = t.$names;
      if (!names) break;
      for (var i=0; i<names.length; i++){
        var intfname = names[i];
        var fnname = map[intfname];
        if (!fnname) fnname = intfname;
        //console.log('addIntf: intftype='+t.$name+' index='+i+' intfname="'+intfname+'" fnname="'+fnname+'" old='+typeof(item[intfname]));
        item[intfname] = jmp(aclass[fnname]);
      }
      t = Object.getPrototypeOf(t);
    }while(t!=null);
  },

  getIntfG: function (obj, guid, query){
    if (!obj) return null;
    //console.log('getIntfG: obj='+obj.$classname+' guid='+guid+' query='+query);
    // search
    var maps = obj.$intfmaps;
    if (!maps) return null;
    var item = maps[guid];
    if (!item) return null;
    // check delegation
    //console.log('getIntfG: obj='+obj.$classname+' guid='+guid+' query='+query+' item='+typeof(item));
    if (typeof item === 'function') return item.call(obj); // delegate. Note: COM contains _AddRef
    // check cache
    var intf = null;
    if (obj.$interfaces){
      intf = obj.$interfaces[guid];
      //console.log('getIntfG: obj='+obj.$classname+' guid='+guid+' cache='+typeof(intf));
    }
    if (!intf){ // intf can be undefined!
      intf = Object.create(item);
      intf.$o = obj;
      if (!obj.$interfaces) obj.$interfaces = {};
      obj.$interfaces[guid] = intf;
    }
    if (typeof(query)==='object'){
      // called by queryIntfT
      var o = null;
      if (intf.QueryInterface(rtl.getIntfGUIDR(query),
          {get:function(){ return o; }, set:function(v){ o=v; }}) === 0){
        return o;
      } else {
        return null;
      }
    } else if(query===2){
      // called by TObject.GetInterfaceByStr
      if (intf.$kind === 'com') intf._AddRef();
    }
    return intf;
  },

  getIntfT: function(obj,intftype){
    return rtl.getIntfG(obj,intftype.$guid);
  },

  queryIntfT: function(obj,intftype){
    return rtl.getIntfG(obj,intftype.$guid,intftype);
  },

  queryIntfIsT: function(obj,intftype){
    var i = rtl.getIntfG(obj,intftype.$guid);
    if (!i) return false;
    if (i.$kind === 'com') i._Release();
    return true;
  },

  asIntfT: function (obj,intftype){
    var i = rtl.getIntfG(obj,intftype.$guid);
    if (i!==null) return i;
    rtl.raiseEInvalidCast();
  },

  intfIsIntfT: function(intf,intftype){
    return (intf!==null) && rtl.queryIntfIsT(intf.$o,intftype);
  },

  intfAsIntfT: function (intf,intftype){
    if (!intf) return null;
    var i = rtl.getIntfG(intf.$o,intftype.$guid);
    if (i) return i;
    rtl.raiseEInvalidCast();
  },

  intfIsClass: function(intf,classtype){
    return (intf!=null) && (rtl.is(intf.$o,classtype));
  },

  intfAsClass: function(intf,classtype){
    if (intf==null) return null;
    return rtl.as(intf.$o,classtype);
  },

  intfToClass: function(intf,classtype){
    if ((intf!==null) && rtl.is(intf.$o,classtype)) return intf.$o;
    return null;
  },

  // interface reference counting
  intfRefs: { // base object for temporary interface variables
    ref: function(id,intf){
      // called for temporary interface references needing delayed release
      var old = this[id];
      //console.log('rtl.intfRefs.ref: id='+id+' old="'+(old?old.$name:'null')+'" intf="'+(intf?intf.$name:'null')+' $o='+(intf?intf.$o:'null'));
      if (old){
        // called again, e.g. in a loop
        delete this[id];
        old._Release(); // may fail
      }
      if(intf) {
        this[id]=intf;
      }
      return intf;
    },
    free: function(){
      //console.log('rtl.intfRefs.free...');
      for (var id in this){
        if (this.hasOwnProperty(id)){
          var intf = this[id];
          if (intf){
            //console.log('rtl.intfRefs.free: id='+id+' '+intf.$name+' $o='+intf.$o.$classname);
            intf._Release();
          }
        }
      }
    }
  },

  createIntfRefs: function(){
    //console.log('rtl.createIntfRefs');
    return Object.create(rtl.intfRefs);
  },

  setIntfP: function(path,name,value,skipAddRef){
    var old = path[name];
    //console.log('rtl.setIntfP path='+path+' name='+name+' old="'+(old?old.$name:'null')+'" value="'+(value?value.$name:'null')+'"');
    if (old === value) return;
    if (old !== null){
      path[name]=null;
      old._Release();
    }
    if (value !== null){
      if (!skipAddRef) value._AddRef();
      path[name]=value;
    }
  },

  setIntfL: function(old,value,skipAddRef){
    //console.log('rtl.setIntfL old="'+(old?old.$name:'null')+'" value="'+(value?value.$name:'null')+'"');
    if (old !== value){
      if (value!==null){
        if (!skipAddRef) value._AddRef();
      }
      if (old!==null){
        old._Release();  // Release after AddRef, to avoid double Release if Release creates an exception
      }
    } else if (skipAddRef){
      if (old!==null){
        old._Release();  // value has an AddRef
      }
    }
    return value;
  },

  _AddRef: function(intf){
    //if (intf) console.log('rtl._AddRef intf="'+(intf?intf.$name:'null')+'"');
    if (intf) intf._AddRef();
    return intf;
  },

  _Release: function(intf){
    //if (intf) console.log('rtl._Release intf="'+(intf?intf.$name:'null')+'"');
    if (intf) intf._Release();
    return intf;
  },

  trunc: function(a){
    return a<0 ? Math.ceil(a) : Math.floor(a);
  },

  checkMethodCall: function(obj,type){
    if (rtl.isObject(obj) && rtl.is(obj,type)) return;
    rtl.raiseE("EInvalidCast");
  },

  oc: function(i){
    // overflow check integer
    if ((Math.floor(i)===i) && (i>=-0x1fffffffffffff) && (i<=0x1fffffffffffff)) return i;
    rtl.raiseE('EIntOverflow');
  },

  rc: function(i,minval,maxval){
    // range check integer
    if ((Math.floor(i)===i) && (i>=minval) && (i<=maxval)) return i;
    rtl.raiseE('ERangeError');
  },

  rcc: function(c,minval,maxval){
    // range check char
    if ((typeof(c)==='string') && (c.length===1)){
      var i = c.charCodeAt(0);
      if ((i>=minval) && (i<=maxval)) return c;
    }
    rtl.raiseE('ERangeError');
  },

  rcSetCharAt: function(s,index,c){
    // range check setCharAt
    if ((typeof(s)!=='string') || (index<0) || (index>=s.length)) rtl.raiseE('ERangeError');
    return rtl.setCharAt(s,index,c);
  },

  rcCharAt: function(s,index){
    // range check charAt
    if ((typeof(s)!=='string') || (index<0) || (index>=s.length)) rtl.raiseE('ERangeError');
    return s.charAt(index);
  },

  rcArrR: function(arr,index){
    // range check read array
    if (Array.isArray(arr) && (typeof(index)==='number') && (index>=0) && (index<arr.length)){
      if (arguments.length>2){
        // arr,index1,index2,...
        arr=arr[index];
        for (var i=2; i<arguments.length; i++) arr=rtl.rcArrR(arr,arguments[i]);
        return arr;
      }
      return arr[index];
    }
    rtl.raiseE('ERangeError');
  },

  rcArrW: function(arr,index,value){
    // range check write array
    // arr,index1,index2,...,value
    for (var i=3; i<arguments.length; i++){
      arr=rtl.rcArrR(arr,index);
      index=arguments[i-1];
      value=arguments[i];
    }
    if (Array.isArray(arr) && (typeof(index)==='number') && (index>=0) && (index<arr.length)){
      return arr[index]=value;
    }
    rtl.raiseE('ERangeError');
  },

  length: function(arr){
    return (arr == null) ? 0 : arr.length;
  },

  arrayRef: function(a){
    if (a!=null) rtl.hideProp(a,'$pas2jsrefcnt',2);
    return a;
  },

  arrayManaged: function(refCnt,mode,a){
    // mode: 0: don't touch elements, 1: null elements, 2: _AddRef elements
    if(!a) a = [];
    a.$pas2jsrefcnt = refCnt?refCnt:0;
    a._AddRef = function(){
      this.$pas2jsrefcnt++;
    };
    a._Release = function(){
      this.$pas2jsrefcnt--;
      if (this.$pas2jsrefcnt==0){
        for (var i=0; i<this.length; i++){
          rtl.setIntfP(this,i,null);
        }
      }
    };
    if (mode>0){
      for (var i=0; i<a.length; i++){
        if (mode === 2){
          rtl._AddRef(a[i]);
        } else {
          a[i]=null;
        }
      }
    }
    return a;
  },

  arraySetLength: function(arr,defaultvalue,newlength){
    var stack = [];
    var s = 9999;
    for (var i=2; i<arguments.length; i++){
      var j = arguments[i];
      if (j==='s'){ s = i-2; }
      else {
        stack.push({ dim:j+0, a:null, i:0, src:null });
      }
    }
    var dimmax = stack.length-1;
    var depth = 0;
    var newlen = 0;
    var item = null;
    var a = null;
    var src = arr;
    var srclen = 0, oldlen = 0;
    var type = 0;
    var managed = false;
    if (rtl.isArray(defaultvalue)){
      // array of dyn array
      type = 1;
    } else if (rtl.isObject(defaultvalue)) {
      if (rtl.isTRecord(defaultvalue)){
        // array of record
        type = 2;
      } else {
        // array of set
        type = 3;
      }
    } else if (defaultvalue == 'R'){
      // array of COM interface
      type = 4;
      managed = true;
    }

    do{
      if (depth>0){
        item = stack[depth-1];
        src = (item.src && item.src.length>item.i) ? item.src[item.i] : null;
      }
      if (!src){
        // init array
        managed ? a=rtl.arrayManaged(1) : a=[];
        srclen = 0;
        oldlen = 0;
      } else if (src.$pas2jsrefcnt>1 || depth>=s){
        // clone
        if (managed){
          a = rtl.arrayManaged(1);
          src.$pas2jsrefcnt--;
        } else {
          a = [];
        }
        srclen = src.length;
        oldlen = srclen;
      } else {
        // keep old
        a = src;
        srclen = 0;
        oldlen = a.length;
      }
      newlen = stack[depth].dim;
      if (managed){
        if (a.length>=newlen){
          // shrink -> release elements
          for (var i=a.length-1; i>=newlen; i--){
            rtl.setIntfP(a,i,null);
          }
          a.length = newlen;
        } else {
          // enlarge -> null elements
          var l = a.length;
          a.length = newlen;
          for (var i=l; i<newlen; i++){
            a[i]=null;
          }
          oldlen = newlen;
        }
      } else {
        a.length = newlen;
      }
      if (depth>0){
        item.a[item.i]=a;
        item.i++;
        if ((newlen===0) && (item.i<item.a.length)) continue;
      }
      if (newlen>0){
        if (depth<dimmax){
          item = stack[depth];
          item.a = a;
          item.i = 0;
          item.src = src;
          depth++;
          continue;
        } else {
          if (srclen>newlen) srclen=newlen;
          if (type == 0){
            // array of simple value
            for (var i=0; i<srclen; i++) a[i]=src[i];
            for (var i=oldlen; i<newlen; i++) a[i]=defaultvalue;
          } else if (type == 1){
            // array of dyn array
            for (var i=0; i<srclen; i++) a[i]=src[i];
            for (var i=oldlen; i<newlen; i++) a[i]=[];
          } else if (type == 2) {
            // array of record
            for (var i=0; i<srclen; i++) a[i]=defaultvalue.$clone(src[i]);
            for (var i=oldlen; i<newlen; i++) a[i]=defaultvalue.$new();
          } else if (type == 3) {
            // array of set
            for (var i=0; i<srclen; i++) a[i]=rtl.refSet(src[i]);
            for (var i=oldlen; i<newlen; i++) a[i]={};
          } else if (type == 4){
            // array of interface
            for (var i=0; i<srclen; i++) rtl.setIntfP(a,i,src[i]);
            for (var i=oldlen; i<newlen; i++) a[i]=null;
          }
        }
      }
      // backtrack
      while ((depth>0) && (stack[depth-1].i>=stack[depth-1].dim)){
        depth--;
      };
      if (depth===0){
        return dimmax===0 ? a : stack[0].a;
      }
    }while (true);
  },

  arrayEq: function(a,b){
    if (a===null) return b===null;
    if (b===null) return false;
    if (a.length!==b.length) return false;
    for (var i=0; i<a.length; i++) if (a[i]!==b[i]) return false;
    return true;
  },

  arrayClone: function(type,src,srcpos,endpos,dst,dstpos){
    // type: 0 for references or simple values
    // src must not be null
    // dst at dstpos must not contain managed old values
    // This function does not range check.
    if(type === 'refSet') {
      for (; srcpos<endpos; srcpos++) dst[dstpos++] = rtl.refSet(src[srcpos]); // ref set
    } else if (type === 'slice'){
      for (; srcpos<endpos; srcpos++) dst[dstpos++] = src[srcpos].slice(0); // clone static array of simple types
    } else if (typeof(type)==='function'){
      for (; srcpos<endpos; srcpos++) dst[dstpos++] = type(src[srcpos]); // clone function
    } else if (rtl.isTRecord(type)){
      for (; srcpos<endpos; srcpos++) dst[dstpos++] = type.$clone(src[srcpos]); // clone record
    } else if (type === 'R'){
      // clone managed instance
      for (; srcpos<endpos; srcpos++){
        dst[dstpos++]=rtl._AddRef(src[srcpos]);
      }
    } else {
      for (; srcpos<endpos; srcpos++) dst[dstpos++] = src[srcpos]; // reference
    };
  },

  arrayConcat: function(type){
    // type: see rtl.arrayClone
    // returns refCnt=1
    var a = [];
    var l = 0;
    for (var i=1; i<arguments.length; i++){
      var src = arguments[i];
      if (src !== null) l+=src.length;
    };
    a.length = l;
    if (type === 'R'){
      rtl.arrayManaged(1,1,a);
    }
    l=0;
    for (var i=1; i<arguments.length; i++){
      var src = arguments[i];
      if (src === null) continue;
      rtl.arrayClone(type,src,0,src.length,a,l);
      l+=src.length;
    };
    return a;
  },

  arrayConcatN: function(){
    var a = null;
    for (var i=0; i<arguments.length; i++){
      var src = arguments[i];
      if (src === null) continue;
      if (a===null){
        a=rtl.arrayRef(src); // Note: concat(arr) does not clone
      } else if (a.$pas2jsrefcnt>1){
        a=a.concat(src); // clone a and append src
      } else {
        for (var i=0; i<src.length; i++){
          a.push(src[i]);
        }
      }
    };
    return a;
  },

  arrayPush: function(type,a){
    if(a===null){
      a=(type==='R') ? rtl.arrayManaged(1) : [];
    } else if (a.$pas2jsrefcnt>1){
      a=rtl.arrayCopy(type,a,0,a.length);
    }
    rtl.arrayClone(type,arguments,2,arguments.length,a,a.length);
    return a;
  },

  arrayPushN: function(a){
    if(a===null){
      a=[];
    } else if (a.$pas2jsrefcnt>1){
      a=a.concat();
    }
    for (var i=1; i<arguments.length; i++){
      a.push(arguments[i]);
    }
    return a;
  },

  arrayCopy: function(type, srcarray, index, count){
    // type: see rtl.arrayClone
    // if count is missing, use srcarray.length
    if (srcarray === null) return (type === 'R') ? null : [];
    if (count === undefined) count=srcarray.length;
    if (index < 0){
      count+=index;
      index = 0;
    }
    var end = index+count;
    if (end>srcarray.length) end = srcarray.length;
    if (index>=end) return (type === 'R') ? null : [];
    if (type===0){
      return srcarray.slice(index,end);
    } else {
      var a = [];
      a.length = end-index;
      if (type === 'R'){
        rtl.arrayManaged(1,1,a);
      }
      rtl.arrayClone(type,srcarray,index,end,a,0);
      return a;
    }
  },

  arrayInsert: function(item, a, index, type){
    var m = (type === 'R');
    if (m) rtl._AddRef(item);
    if (a){
      if (a.$pas2jsrefcnt>1){
        if (m){
          // clone
          a.$pas2jsrefcnt--;
          a=rtl.arrayManaged(1,2,a.concat());
        } else {
          a=a.concat();
        }
      }
      a.splice(index,0,item);
      return a;
    } else {
      a = [item];
      if (m) a=rtl.arrayManaged(1,0,a);
      return a;
    }
  },

  arrayDeleteR: function(a, index, count){
    if (a===null || index<0 || index>=a.length || count<=0) return a;
    if (index+count>a.length) count=a.length-index;
    if (a.$pas2jsrefcnt>1){
      // clone
      a.$pas2jsrefcnt--;
      a=rtl.arrayManaged(1,2,a.concat());
    }
    for (var i=0; i<count; i++) rtl.setIntfP(a,index+i,null);
    a.splice(index,count);
    return a;
  },

  setCharAt: function(s,index,c){
    return s.substr(0,index)+c+s.substr(index+1);
  },

  getResStr: function(mod,name){
    var rs = mod.$resourcestrings[name];
    return rs.current?rs.current:rs.org;
  },

  createSet: function(){
    var s = {};
    for (var i=0; i<arguments.length; i++){
      if (arguments[i]!=null){
        s[arguments[i]]=true;
      } else {
        var first=arguments[i+=1];
        var last=arguments[i+=1];
        for(var j=first; j<=last; j++) s[j]=true;
      }
    }
    return s;
  },

  cloneSet: function(s){
    var r = {};
    for (var key in s) r[key]=true;
    return r;
  },

  refSet: function(s){
    rtl.hideProp(s,'$shared',true);
    return s;
  },

  includeSet: function(s,enumvalue){
    if (s.$shared) s = rtl.cloneSet(s);
    s[enumvalue] = true;
    return s;
  },

  excludeSet: function(s,enumvalue){
    if (s.$shared) s = rtl.cloneSet(s);
    delete s[enumvalue];
    return s;
  },

  diffSet: function(s,t){
    var r = {};
    for (var key in s) if (!t[key]) r[key]=true;
    return r;
  },

  unionSet: function(s,t){
    var r = {};
    for (var key in s) r[key]=true;
    for (var key in t) r[key]=true;
    return r;
  },

  intersectSet: function(s,t){
    var r = {};
    for (var key in s) if (t[key]) r[key]=true;
    return r;
  },

  symDiffSet: function(s,t){
    var r = {};
    for (var key in s) if (!t[key]) r[key]=true;
    for (var key in t) if (!s[key]) r[key]=true;
    return r;
  },

  eqSet: function(s,t){
    for (var key in s) if (!t[key]) return false;
    for (var key in t) if (!s[key]) return false;
    return true;
  },

  neSet: function(s,t){
    return !rtl.eqSet(s,t);
  },

  leSet: function(s,t){
    for (var key in s) if (!t[key]) return false;
    return true;
  },

  geSet: function(s,t){
    for (var key in t) if (!s[key]) return false;
    return true;
  },

  strSetLength: function(s,newlen){
    var oldlen = s.length;
    if (oldlen > newlen){
      return s.substring(0,newlen);
    } else if (s.repeat){
      // Note: repeat needs ECMAScript6!
      return s+' '.repeat(newlen-oldlen);
    } else {
       while (oldlen<newlen){
         s+=' ';
         oldlen++;
       };
       return s;
    }
  },

  spaceLeft: function(s,width){
    var l=s.length;
    if (l>=width) return s;
    if (s.repeat){
      // Note: repeat needs ECMAScript6!
      return ' '.repeat(width-l) + s;
    } else {
      while (l<width){
        s=' '+s;
        l++;
      };
      return s;
    };
  },

  floatToStr: function(d,w,p){
    // input 1-3 arguments: double, width, precision
    if (arguments.length>2){
      return rtl.spaceLeft(d.toFixed(p),w);
    } else {
	  // exponent width
	  var pad = "";
	  var ad = Math.abs(d);
	  if (((ad>1) && (ad<1.0e+10)) ||  ((ad>1.e-10) && (ad<1))) {
		pad='00';
	  } else if ((ad>1) && (ad<1.0e+100) || (ad<1.e-10)) {
		pad='0';
      }  	
	  if (arguments.length<2) {
	    w=24;		
      } else if (w<9) {
		w=9;
      }		  
      var p = w-8;
      var s=(d>0 ? " " : "" ) + d.toExponential(p);
      s=s.replace(/e(.)/,'E$1'+pad);
      return rtl.spaceLeft(s,w);
    }
  },

  valEnum: function(s, enumType, setCodeFn){
    s = s.toLowerCase();
    for (var key in enumType){
      if((typeof(key)==='string') && (key.toLowerCase()===s)){
        setCodeFn(0);
        return enumType[key];
      }
    }
    setCodeFn(1);
    return 0;
  },

  lw: function(l){
    // fix longword bitwise operation
    return l<0?l+0x100000000:l;
  },

  and: function(a,b){
    var hi = 0x80000000;
    var low = 0x7fffffff;
    var h = (a / hi) & (b / hi);
    var l = (a & low) & (b & low);
    return h*hi + l;
  },

  or: function(a,b){
    var hi = 0x80000000;
    var low = 0x7fffffff;
    var h = (a / hi) | (b / hi);
    var l = (a & low) | (b & low);
    return h*hi + l;
  },

  xor: function(a,b){
    var hi = 0x80000000;
    var low = 0x7fffffff;
    var h = (a / hi) ^ (b / hi);
    var l = (a & low) ^ (b & low);
    return h*hi + l;
  },

  shr: function(a,b){
    if (a<0) a += rtl.hiInt;
    if (a<0x80000000) return a >> b;
    if (b<=0) return a;
    if (b>54) return 0;
    return Math.floor(a / Math.pow(2,b));
  },

  shl: function(a,b){
    if (a<0) a += rtl.hiInt;
    if (b<=0) return a;
    if (b>54) return 0;
    var r = a * Math.pow(2,b);
    if (r <= rtl.hiInt) return r;
    return r % rtl.hiInt;
  },

  initRTTI: function(){
    if (rtl.debug_rtti) rtl.debug('initRTTI');

    // base types
    rtl.tTypeInfo = { name: "tTypeInfo", kind: 0, $module: null, attr: null };
    function newBaseTI(name,kind,ancestor){
      if (!ancestor) ancestor = rtl.tTypeInfo;
      if (rtl.debug_rtti) rtl.debug('initRTTI.newBaseTI "'+name+'" '+kind+' ("'+ancestor.name+'")');
      var t = Object.create(ancestor);
      t.name = name;
      t.kind = kind;
      rtl[name] = t;
      return t;
    };
    function newBaseInt(name,minvalue,maxvalue,ordtype){
      var t = newBaseTI(name,1 /* tkInteger */,rtl.tTypeInfoInteger);
      t.minvalue = minvalue;
      t.maxvalue = maxvalue;
      t.ordtype = ordtype;
      return t;
    };
    newBaseTI("tTypeInfoInteger",1 /* tkInteger */);
    newBaseInt("shortint",-0x80,0x7f,0);
    newBaseInt("byte",0,0xff,1);
    newBaseInt("smallint",-0x8000,0x7fff,2);
    newBaseInt("word",0,0xffff,3);
    newBaseInt("longint",-0x80000000,0x7fffffff,4);
    newBaseInt("longword",0,0xffffffff,5);
    newBaseInt("nativeint",-0x10000000000000,0xfffffffffffff,6);
    newBaseInt("nativeuint",0,0xfffffffffffff,7);
    newBaseInt("char",0,65535,3 /* word */).kind=2 /* tkChar */;
    newBaseTI("string",3 /* tkString */);
    newBaseTI("tTypeInfoEnum",4 /* tkEnumeration */,rtl.tTypeInfoInteger);
    newBaseTI("tTypeInfoSet",5 /* tkSet */);
    newBaseTI("double",6 /* tkDouble */);
    newBaseTI("boolean",7 /* tkBool */);
    newBaseTI("tTypeInfoProcVar",8 /* tkProcVar */);
    newBaseTI("tTypeInfoMethodVar",9 /* tkMethod */,rtl.tTypeInfoProcVar);
    newBaseTI("tTypeInfoArray",10 /* tkArray */);
    newBaseTI("tTypeInfoDynArray",11 /* tkDynArray */);
    newBaseTI("tTypeInfoPointer",15 /* tkPointer */);
    var t = newBaseTI("pointer",15 /* tkPointer */,rtl.tTypeInfoPointer);
    t.reftype = null;
    newBaseTI("jsvalue",16 /* tkJSValue */);
    newBaseTI("tTypeInfoRefToProcVar",17 /* tkRefToProcVar */,rtl.tTypeInfoProcVar);

    // member kinds
    rtl.tTypeMember = { attr: null };
    function newMember(name,kind){
      var m = Object.create(rtl.tTypeMember);
      m.name = name;
      m.kind = kind;
      rtl[name] = m;
    };
    newMember("tTypeMemberField",1); // tmkField
    newMember("tTypeMemberMethod",2); // tmkMethod
    newMember("tTypeMemberProperty",3); // tmkProperty

    // base object for storing members: a simple object
    rtl.tTypeMembers = {};

    // tTypeInfoStruct - base object for tTypeInfoClass, tTypeInfoRecord, tTypeInfoInterface
    var tis = newBaseTI("tTypeInfoStruct",0);
    tis.$addMember = function(name,ancestor,vis,options){
      if (rtl.debug_rtti){
        if (!rtl.hasString(name) || (name.charAt()==='$')) throw 'invalid member "'+name+'", this="'+this.name+'"';
        if (!rtl.is(ancestor,rtl.tTypeMember)) throw 'invalid ancestor "'+ancestor+':'+ancestor.name+'", "'+this.name+'.'+name+'"';
        if ((options!=undefined) && (typeof(options)!='object')) throw 'invalid options "'+options+'", "'+this.name+'.'+name+'"';
      };
      var t = Object.create(ancestor);
      t.name = name;
      this.members[name] = t;
      this.names.push(name);
      t.visibility = vis;
      if (rtl.isObject(options)){
        for (var key in options) if (options.hasOwnProperty(key)) t[key] = options[key];
      };
      return t;
    };
    tis.addField = function(name,type,vis,options){
      var t = this.$addMember(name,rtl.tTypeMemberField,vis?vis:2,options);
      if (rtl.debug_rtti){
        if (!rtl.is(type,rtl.tTypeInfo)) throw 'invalid type "'+type+'", "'+this.name+'.'+name+'"';
      };
      t.typeinfo = type;
      this.fields.push(name);
      return t;
    };
    tis.addFields = function(){
      var i=0;
      while(i<arguments.length){
        var name = arguments[i++];
        var type = arguments[i++];
        if ((i<arguments.length) && (typeof(arguments[i])==='object')){
          this.addField(name,type,arguments[i++]);
        } else {
          this.addField(name,type);
        };
      };
    };
    tis.addMethod = function(name,methodkind,params,vis,result,flags,options){
      // optional: vis, result, flags, options
      var t = this.$addMember(name,rtl.tTypeMemberMethod,vis?vis:2,options);
      t.methodkind = methodkind;
      t.procsig = rtl.newTIProcSig(params,result,flags);
      this.methods.push(name);
      return t;
    };
    tis.addProperty = function(name,flags,result,getter,setter,vis,options){
      var t = this.$addMember(name,rtl.tTypeMemberProperty,vis?vis:4,options);
      t.flags = flags;
      t.typeinfo = result;
      t.getter = getter;
      t.setter = setter;
      // Note: in options: params, stored, defaultvalue
      t.params = rtl.isArray(t.params) ? rtl.newTIParams(t.params) : null;
      this.properties.push(name);
      if (!rtl.isString(t.stored)) t.stored = "";
      return t;
    };
    tis.getField = function(index){
      return this.members[this.fields[index]];
    };
    tis.getMethod = function(index){
      return this.members[this.methods[index]];
    };
    tis.getProperty = function(index){
      return this.members[this.properties[index]];
    };

    newBaseTI("tTypeInfoRecord",12 /* tkRecord */,rtl.tTypeInfoStruct);
    newBaseTI("tTypeInfoClass",13 /* tkClass */,rtl.tTypeInfoStruct);
    newBaseTI("tTypeInfoClassRef",14 /* tkClassRef */);
    newBaseTI("tTypeInfoInterface",18 /* tkInterface */,rtl.tTypeInfoStruct);
    newBaseTI("tTypeInfoHelper",19 /* tkHelper */,rtl.tTypeInfoStruct);
    newBaseTI("tTypeInfoExtClass",20 /* tkExtClass */,rtl.tTypeInfoClass);
  },

  tSectionRTTI: {
    $module: null,
    $inherited: function(name,ancestor,o){
      if (rtl.debug_rtti){
        rtl.debug('tSectionRTTI.newTI "'+(this.$module?this.$module.$name:"(no module)")
          +'"."'+name+'" ('+ancestor.name+') '+(o?'init':'forward'));
      };
      var t = this[name];
      if (t){
        if (!t.$forward) throw 'duplicate type "'+name+'"';
        if (!ancestor.isPrototypeOf(t)) throw 'typeinfo ancestor mismatch "'+name+'" ancestor="'+ancestor.name+'" t.name="'+t.name+'"';
      } else {
        t = Object.create(ancestor);
        t.name = name;
        t.$module = this.$module;
        this[name] = t;
      }
      if (o){
        delete t.$forward;
        for (var key in o) if (o.hasOwnProperty(key)) t[key]=o[key];
      } else {
        t.$forward = true;
      }
      return t;
    },
    $Scope: function(name,ancestor,o){
      var t=this.$inherited(name,ancestor,o);
      t.members = {};
      t.names = [];
      t.fields = [];
      t.methods = [];
      t.properties = [];
      return t;
    },
    $TI: function(name,kind,o){ var t=this.$inherited(name,rtl.tTypeInfo,o); t.kind = kind; return t; },
    $Int: function(name,o){ return this.$inherited(name,rtl.tTypeInfoInteger,o); },
    $Enum: function(name,o){ return this.$inherited(name,rtl.tTypeInfoEnum,o); },
    $Set: function(name,o){ return this.$inherited(name,rtl.tTypeInfoSet,o); },
    $StaticArray: function(name,o){ return this.$inherited(name,rtl.tTypeInfoArray,o); },
    $DynArray: function(name,o){ return this.$inherited(name,rtl.tTypeInfoDynArray,o); },
    $ProcVar: function(name,o){ return this.$inherited(name,rtl.tTypeInfoProcVar,o); },
    $RefToProcVar: function(name,o){ return this.$inherited(name,rtl.tTypeInfoRefToProcVar,o); },
    $MethodVar: function(name,o){ return this.$inherited(name,rtl.tTypeInfoMethodVar,o); },
    $Record: function(name,o,typ){ if(typ) o.$record = typ; return this.$Scope(name,rtl.tTypeInfoRecord,o); },
    $Class: function(name,o){ return this.$Scope(name,rtl.tTypeInfoClass,o); },
    $ClassRef: function(name,o){ return this.$inherited(name,rtl.tTypeInfoClassRef,o); },
    $Pointer: function(name,o){ return this.$inherited(name,rtl.tTypeInfoPointer,o); },
    $Interface: function(name,o){ return this.$Scope(name,rtl.tTypeInfoInterface,o); },
    $Helper: function(name,o){ return this.$Scope(name,rtl.tTypeInfoHelper,o); },
    $ExtClass: function(name,o){ return this.$Scope(name,rtl.tTypeInfoExtClass,o); }
  },

  newTIParam: function(param){
    // param is an array, 0=name, 1=type, 2=optional flags
    var t = {
      name: param[0],
      typeinfo: param[1],
      flags: (rtl.isNumber(param[2]) ? param[2] : 0)
    };
    return t;
  },

  newTIParams: function(list){
    // list: optional array of [paramname,typeinfo,optional flags]
    var params = [];
    if (rtl.isArray(list)){
      for (var i=0; i<list.length; i++) params.push(rtl.newTIParam(list[i]));
    };
    return params;
  },

  newTIProcSig: function(params,result,flags){
    var s = {
      params: rtl.newTIParams(params),
      resulttype: result?result:null,
      flags: flags?flags:0
    };
    return s;
  },

  addResource: function(aRes){
    rtl.$res[aRes.name]=aRes;
  },

  getResource: function(aName){
    var res = rtl.$res[aName];
    if (res !== undefined) {
      return res;
    } else {
      return null;
    }
  },

  getResourceList: function(){
    return Object.keys(rtl.$res);
  }
}

rtl.module("System",[],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.LineEnding = "\n";
  this.sLineBreak = this.LineEnding;
  this.PathDelim = "/";
  this.$rtti.$Set("AllowDirectorySeparators$a",{comptype: rtl.char});
  this.AllowDirectorySeparators = rtl.createSet(47);
  this.$rtti.$Set("AllowDriveSeparators$a",{comptype: rtl.char});
  this.AllowDriveSeparators = rtl.createSet(58);
  this.ExtensionSeparator = ".";
  this.MaxSmallint = 32767;
  this.MinSmallint = -32768;
  this.MaxShortInt = 127;
  this.MinShortInt = -128;
  this.MaxByte = 0xFF;
  this.MaxWord = 0xFFFF;
  this.MaxLongint = 0x7fffffff;
  this.MaxCardinal = 0xffffffff;
  this.Maxint = 2147483647;
  this.IsMultiThread = false;
  this.$rtti.$inherited("Real",rtl.double,{});
  this.$rtti.$inherited("Extended",rtl.double,{});
  this.$rtti.$inherited("TDateTime",rtl.double,{});
  this.$rtti.$inherited("TTime",this.$rtti["TDateTime"],{});
  this.$rtti.$inherited("TDate",this.$rtti["TDateTime"],{});
  this.$rtti.$inherited("Int64",rtl.nativeint,{});
  this.$rtti.$inherited("UInt64",rtl.nativeuint,{});
  this.$rtti.$inherited("QWord",rtl.nativeuint,{});
  this.$rtti.$inherited("Single",rtl.double,{});
  this.$rtti.$inherited("Comp",rtl.nativeint,{});
  this.$rtti.$inherited("UnicodeString",rtl.string,{});
  this.$rtti.$inherited("WideString",rtl.string,{});
  this.TTextLineBreakStyle = {"0": "tlbsLF", tlbsLF: 0, "1": "tlbsCRLF", tlbsCRLF: 1, "2": "tlbsCR", tlbsCR: 2};
  this.$rtti.$Enum("TTextLineBreakStyle",{minvalue: 0, maxvalue: 2, ordtype: 1, enumtype: this.TTextLineBreakStyle});
  this.TCompareOption = {"0": "coIgnoreCase", coIgnoreCase: 0};
  this.$rtti.$Enum("TCompareOption",{minvalue: 0, maxvalue: 0, ordtype: 1, enumtype: this.TCompareOption});
  this.$rtti.$Set("TCompareOptions",{comptype: this.$rtti["TCompareOption"]});
  rtl.recNewT(this,"TGuid",function () {
    this.D1 = 0;
    this.D2 = 0;
    this.D3 = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.D4 = rtl.arraySetLength(null,0,8);
      return r;
    };
    this.$eq = function (b) {
      return (this.D1 === b.D1) && (this.D2 === b.D2) && (this.D3 === b.D3) && rtl.arrayEq(this.D4,b.D4);
    };
    this.$assign = function (s) {
      this.D1 = s.D1;
      this.D2 = s.D2;
      this.D3 = s.D3;
      this.D4 = s.D4.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("TGuid",{},this);
    $r.addField("D1",rtl.longword);
    $r.addField("D2",rtl.word);
    $r.addField("D3",rtl.word);
    $mod.$rtti.$StaticArray("TGuid.D4$a",{dims: [8], eltype: rtl.byte});
    $r.addField("D4",$mod.$rtti["TGuid.D4$a"]);
  });
  this.$rtti.$inherited("TGUIDString",rtl.string,{});
  rtl.recNewT(this,"TMethod",function () {
    this.Code = null;
    this.Data = null;
    this.$eq = function (b) {
      return (this.Code === b.Code) && (this.Data === b.Data);
    };
    this.$assign = function (s) {
      this.Code = s.Code;
      this.Data = s.Data;
      return this;
    };
    var $r = $mod.$rtti.$Record("TMethod",{},this);
    $r.addField("Code",rtl.pointer);
    $r.addField("Data",rtl.pointer);
  });
  this.$rtti.$Pointer("PMethod",{reftype: this.$rtti["TMethod"]});
  this.$rtti.$Class("TObject");
  this.$rtti.$ClassRef("TClass",{instancetype: this.$rtti["TObject"]});
  rtl.createClass(this,"TObject",null,function () {
    this.$init = function () {
    };
    this.$final = function () {
    };
    this.Create = function () {
      return this;
    };
    this.Destroy = function () {
    };
    this.Free = function () {
      this.$destroy("Destroy");
    };
    this.ClassType = function () {
      return this;
    };
    this.ClassNameIs = function (Name) {
      var Result = false;
      Result = $impl.SameText(Name,this.$classname);
      return Result;
    };
    this.InheritsFrom = function (aClass) {
      return (aClass!=null) && ((this==aClass) || aClass.isPrototypeOf(this));
    };
    this.MethodName = function (aCode) {
      var Result = "";
      Result = "";
      if (aCode === null) return Result;
      if (typeof(aCode)!=='function') return "";
      var i = 0;
      var TI = this.$rtti;
      if (rtl.isObject(aCode.scope)){
        // callback
        if (typeof aCode.fn === "string") return aCode.fn;
        aCode = aCode.fn;
      }
      // Not a callback, check rtti
      while ((Result === "") && (TI != null)) {
        i = 0;
        while ((Result === "") && (i < TI.methods.length)) {
          if (this[TI.getMethod(i).name] === aCode)
            Result=TI.getMethod(i).name;
          i += 1;
        };
        if (Result === "") TI = TI.ancestor;
      };
      // return Result;
      return Result;
    };
    this.MethodAddress = function (aName) {
      var Result = null;
      Result = null;
      if (aName === "") return Result;
      var i = 0;
        var TI = this.$rtti;
        var N = "";
        var MN = "";
        N = aName.toLowerCase();
        while ((MN === "") && (TI != null)) {
          i = 0;
          while ((MN === "") && (i < TI.methods.length)) {
            if (TI.getMethod(i).name.toLowerCase() === N) MN = TI.getMethod(i).name;
            i += 1;
          };
          if (MN === "") TI = TI.ancestor;
        };
        if (MN !== "") Result = this[MN];
      //  return Result;
      return Result;
    };
    this.FieldAddress = function (aName) {
      var Result = null;
      Result = null;
      if (aName === "") return Result;
      var aClass = this.$class;
      var ClassTI = null;
      var myName = aName.toLowerCase();
      var MemberTI = null;
      while (aClass !== null) {
        ClassTI = aClass.$rtti;
        for (var i = 0, $end2 = ClassTI.fields.length - 1; i <= $end2; i++) {
          MemberTI = ClassTI.getField(i);
          if (MemberTI.name.toLowerCase() === myName) {
             return MemberTI;
          };
        };
        aClass = aClass.$ancestor ? aClass.$ancestor : null;
      };
      return Result;
    };
    this.ClassInfo = function () {
      var Result = null;
      Result = this.$rtti;
      return Result;
    };
    this.QualifiedClassName = function () {
      var Result = "";
      Result = this.$module.$name + "." + this.$classname;
      return Result;
    };
    this.AfterConstruction = function () {
    };
    this.BeforeDestruction = function () {
    };
    this.Dispatch = function (aMessage) {
      var aClass = null;
      var Id = undefined;
      if (!rtl.isObject(aMessage)) return;
      Id = aMessage["Msg"];
      if (!rtl.isNumber(Id)) return;
      aClass = this.$class.ClassType();
      while (aClass !== null) {
        var Handlers = aClass.$msgint;
        if (rtl.isObject(Handlers) && Handlers.hasOwnProperty(Id)){
          this[Handlers[Id]](aMessage);
          return;
        };
        aClass = aClass.$ancestor;
      };
      this.DefaultHandler(aMessage);
    };
    this.DispatchStr = function (aMessage) {
      var aClass = null;
      var Id = undefined;
      if (!rtl.isObject(aMessage)) return;
      Id = aMessage["MsgStr"];
      if (!rtl.isString(Id)) return;
      aClass = this.$class.ClassType();
      while (aClass !== null) {
        var Handlers = aClass.$msgstr;
        if (rtl.isObject(Handlers) && Handlers.hasOwnProperty(Id)){
          this[Handlers[Id]](aMessage);
          return;
        };
        aClass = aClass.$ancestor;
      };
      this.DefaultHandlerStr(aMessage);
    };
    this.DefaultHandler = function (aMessage) {
      if (aMessage) ;
    };
    this.DefaultHandlerStr = function (aMessage) {
      if (aMessage) ;
    };
    this.GetInterface = function (iid, obj) {
      var Result = false;
      var i = iid.$intf;
      if (i){
        // iid is the private TGuid of an interface
        i = rtl.getIntfG(this,i.$guid,2);
        if (i){
          obj.set(i);
          return true;
        }
      };
      Result = this.GetInterfaceByStr(rtl.guidrToStr(iid),obj);
      return Result;
    };
    this.GetInterface$1 = function (iidstr, obj) {
      var Result = false;
      Result = this.GetInterfaceByStr(iidstr,obj);
      return Result;
    };
    this.GetInterfaceByStr = function (iidstr, obj) {
      var Result = false;
      Result = false;
      if (!$mod.IObjectInstance["$str"]) $mod.IObjectInstance["$str"] = rtl.guidrToStr($mod.IObjectInstance);
      if (iidstr == $mod.IObjectInstance["$str"]) {
        obj.set(this);
        return true;
      };
      var i = rtl.getIntfG(this,iidstr,2);
      obj.set(i);
      Result=(i!==null);
      return Result;
    };
    this.GetInterfaceWeak = function (iid, obj) {
      var Result = false;
      Result = this.GetInterface(iid,obj);
      if (Result){
        var o = obj.get();
        if (o.$kind==='com'){
          o._Release();
        }
      };
      return Result;
    };
    this.Equals = function (Obj) {
      var Result = false;
      Result = Obj === this;
      return Result;
    };
    this.ToString = function () {
      var Result = "";
      Result = this.$classname;
      return Result;
    };
  });
  rtl.createClass(this,"TCustomAttribute",this.TObject,function () {
  });
  this.$rtti.$ClassRef("TCustomAttributeClass",{instancetype: this.$rtti["TCustomAttribute"]});
  this.$rtti.$DynArray("TCustomAttributeArray",{eltype: this.$rtti["TCustomAttribute"]});
  this.S_OK = 0;
  this.S_FALSE = 1;
  this.E_NOINTERFACE = -2147467262;
  this.E_UNEXPECTED = -2147418113;
  this.E_NOTIMPL = -2147467263;
  rtl.createInterface(this,"IUnknown","{00000000-0000-0000-C000-000000000046}",["QueryInterface","_AddRef","_Release"],null,function () {
    this.$kind = "com";
    var $r = this.$rtti;
    $r.addMethod("QueryInterface",1,[["iid",$mod.$rtti["TGuid"],2],["obj",null,4]],2,rtl.longint);
    $r.addMethod("_AddRef",1,[],2,rtl.longint);
    $r.addMethod("_Release",1,[],2,rtl.longint);
  });
  rtl.createInterface(this,"IInvokable","{88387EF6-BCEE-3E17-9E85-5D491ED4FC10}",[],this.IUnknown,function () {
  });
  rtl.createInterface(this,"IEnumerator","{ECEC7568-4E50-30C9-A2F0-439342DE2ADB}",["GetCurrent","MoveNext","Reset"],this.IUnknown,function () {
    var $r = this.$rtti;
    $r.addMethod("GetCurrent",1,[],2,$mod.$rtti["TObject"]);
    $r.addMethod("MoveNext",1,[],2,rtl.boolean);
    $r.addMethod("Reset",0,[]);
    $r.addProperty("Current",1,$mod.$rtti["TObject"],"GetCurrent","",2);
  });
  rtl.createInterface(this,"IEnumerable","{9791C368-4E51-3424-A3CE-D4911D54F385}",["GetEnumerator"],this.IUnknown,function () {
    var $r = this.$rtti;
    $r.addMethod("GetEnumerator",1,[],2,$mod.$rtti["IEnumerator"]);
  });
  rtl.createClass(this,"TInterfacedObject",this.TObject,function () {
    this.$init = function () {
      $mod.TObject.$init.call(this);
      this.fRefCount = 0;
    };
    this.QueryInterface = function (iid, obj) {
      var Result = 0;
      if (this.GetInterface(iid,obj)) {
        Result = 0}
       else Result = -2147467262;
      return Result;
    };
    this._AddRef = function () {
      var Result = 0;
      this.fRefCount += 1;
      Result = this.fRefCount;
      return Result;
    };
    this._Release = function () {
      var Result = 0;
      this.fRefCount -= 1;
      Result = this.fRefCount;
      if (this.fRefCount === 0) this.$destroy("Destroy");
      return Result;
    };
    this.BeforeDestruction = function () {
      if (this.fRefCount !== 0) rtl.raiseE('EHeapMemoryError');
    };
    rtl.addIntf(this,$mod.IUnknown);
  });
  this.$rtti.$ClassRef("TInterfacedClass",{instancetype: this.$rtti["TInterfacedObject"]});
  rtl.createClass(this,"TAggregatedObject",this.TObject,function () {
    this.$init = function () {
      $mod.TObject.$init.call(this);
      this.fController = null;
    };
    this.GetController = function () {
      var Result = null;
      var $ok = false;
      try {
        Result = rtl.setIntfL(Result,this.fController);
        $ok = true;
      } finally {
        if (!$ok) rtl._Release(Result);
      };
      return Result;
    };
    this.QueryInterface = function (iid, obj) {
      var Result = 0;
      Result = this.fController.QueryInterface(iid,obj);
      return Result;
    };
    this._AddRef = function () {
      var Result = 0;
      Result = this.fController._AddRef();
      return Result;
    };
    this._Release = function () {
      var Result = 0;
      Result = this.fController._Release();
      return Result;
    };
    this.Create$1 = function (aController) {
      $mod.TObject.Create.call(this);
      this.fController = aController;
      return this;
    };
  });
  rtl.createClass(this,"TContainedObject",this.TAggregatedObject,function () {
    this.QueryInterface = function (iid, obj) {
      var Result = 0;
      if (this.GetInterface(iid,obj)) {
        Result = 0}
       else Result = -2147467262;
      return Result;
    };
    rtl.addIntf(this,$mod.IUnknown);
  });
  this.IObjectInstance = this.TGuid.$clone({D1: 0xD91C9AF4, D2: 0x3C93, D3: 0x420F, D4: [0xA3,0x03,0xBF,0x5B,0xA8,0x2B,0xFD,0x23]});
  this.TTypeKind = {"0": "tkUnknown", tkUnknown: 0, "1": "tkInteger", tkInteger: 1, "2": "tkChar", tkChar: 2, "3": "tkString", tkString: 3, "4": "tkEnumeration", tkEnumeration: 4, "5": "tkSet", tkSet: 5, "6": "tkDouble", tkDouble: 6, "7": "tkBool", tkBool: 7, "8": "tkProcVar", tkProcVar: 8, "9": "tkMethod", tkMethod: 9, "10": "tkArray", tkArray: 10, "11": "tkDynArray", tkDynArray: 11, "12": "tkRecord", tkRecord: 12, "13": "tkClass", tkClass: 13, "14": "tkClassRef", tkClassRef: 14, "15": "tkPointer", tkPointer: 15, "16": "tkJSValue", tkJSValue: 16, "17": "tkRefToProcVar", tkRefToProcVar: 17, "18": "tkInterface", tkInterface: 18, "19": "tkHelper", tkHelper: 19, "20": "tkExtClass", tkExtClass: 20};
  this.$rtti.$Enum("TTypeKind",{minvalue: 0, maxvalue: 20, ordtype: 1, enumtype: this.TTypeKind});
  this.$rtti.$Set("TTypeKinds",{comptype: this.$rtti["TTypeKind"]});
  this.tkFloat = this.TTypeKind.tkDouble;
  this.tkProcedure = this.TTypeKind.tkProcVar;
  this.tkAny = rtl.createSet(null,this.TTypeKind.tkUnknown,this.TTypeKind.tkExtClass);
  this.tkMethods = rtl.createSet(this.TTypeKind.tkMethod);
  this.tkProperties = rtl.diffSet(rtl.diffSet(this.tkAny,this.tkMethods),rtl.createSet(this.TTypeKind.tkUnknown));
  this.vtInteger = 0;
  this.vtBoolean = 1;
  this.vtExtended = 3;
  this.vtPointer = 5;
  this.vtObject = 7;
  this.vtClass = 8;
  this.vtWideChar = 9;
  this.vtCurrency = 12;
  this.vtInterface = 14;
  this.vtUnicodeString = 18;
  this.vtNativeInt = 19;
  this.vtJSValue = 20;
  this.$rtti.$Pointer("PVarRec",{reftype: this.$rtti["TVarRec"]});
  rtl.recNewT(this,"TVarRec",function () {
    this.VType = 0;
    this.VJSValue = undefined;
    this.$eq = function (b) {
      return (this.VType === b.VType) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue) && (this.VJSValue === b.VJSValue);
    };
    this.$assign = function (s) {
      this.VType = s.VType;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      this.VJSValue = s.VJSValue;
      return this;
    };
    var $r = $mod.$rtti.$Record("TVarRec",{},this);
    $r.addField("VType",rtl.byte);
    $r.addField("VJSValue",rtl.jsvalue);
    $r.addField("VJSValue",rtl.longint);
    $r.addField("VJSValue",rtl.boolean);
    $r.addField("VJSValue",rtl.double);
    $r.addField("VJSValue",rtl.pointer);
    $r.addField("VJSValue",$mod.$rtti["TObject"]);
    $r.addField("VJSValue",$mod.$rtti["TClass"]);
    $r.addField("VJSValue",rtl.char);
    $r.addField("VJSValue",rtl.nativeint);
    $r.addField("VJSValue",rtl.pointer);
    $r.addField("VJSValue",$mod.$rtti["UnicodeString"]);
    $r.addField("VJSValue",rtl.nativeint);
  });
  this.$rtti.$DynArray("TVarRecArray",{eltype: this.$rtti["TVarRec"]});
  this.VarRecs = function () {
    var Result = [];
    var i = 0;
    var v = null;
    Result = [];
    while (i < arguments.length) {
      v = $mod.TVarRec.$new();
      v.VType = rtl.trunc(arguments[i]);
      i += 1;
      v.VJSValue = arguments[i];
      i += 1;
      Result.push($mod.TVarRec.$clone(v));
    };
    return Result;
  };
  this.IsConsole = false;
  this.FirstDotAtFileNameStartIsExtension = false;
  this.$rtti.$ProcVar("TOnParamCount",{procsig: rtl.newTIProcSig([],rtl.longint)});
  this.$rtti.$ProcVar("TOnParamStr",{procsig: rtl.newTIProcSig([["Index",rtl.longint]],rtl.string)});
  this.OnParamCount = null;
  this.OnParamStr = null;
  this.ParamCount = function () {
    var Result = 0;
    if ($mod.OnParamCount != null) {
      Result = $mod.OnParamCount()}
     else Result = 0;
    return Result;
  };
  this.ParamStr = function (Index) {
    var Result = "";
    if ($mod.OnParamStr != null) {
      Result = $mod.OnParamStr(Index)}
     else if (Index === 0) {
      Result = "js"}
     else Result = "";
    return Result;
  };
  this.Frac = function (A) {
    return A % 1;
  };
  this.Odd = function (A) {
    return A&1 != 0;
  };
  this.Random = function (Range) {
    return Math.floor(Math.random()*Range);
  };
  this.Sqr = function (A) {
    return A*A;
  };
  this.Sqr$1 = function (A) {
    return A*A;
  };
  this.Trunc = function (A) {
    if (!Math.trunc) {
      Math.trunc = function(v) {
        v = +v;
        if (!isFinite(v)) return v;
        return (v - v % 1) || (v < 0 ? -0 : v === 0 ? v : 0);
      };
    }
    $mod.Trunc = Math.trunc;
    return Math.trunc(A);
  };
  this.DefaultTextLineBreakStyle = this.TTextLineBreakStyle.tlbsLF;
  this.Int = function (A) {
    var Result = 0.0;
    Result = $mod.Trunc(A);
    return Result;
  };
  this.Copy = function (S, Index, Size) {
    if (Index<1) Index = 1;
    return (Size>0) ? S.substring(Index-1,Index+Size-1) : "";
  };
  this.Copy$1 = function (S, Index) {
    if (Index<1) Index = 1;
    return S.substr(Index-1);
  };
  this.Delete = function (S, Index, Size) {
    var h = "";
    if ((Index < 1) || (Index > S.get().length) || (Size <= 0)) return;
    h = S.get();
    S.set($mod.Copy(h,1,Index - 1) + $mod.Copy$1(h,Index + Size));
  };
  this.Pos = function (Search, InString) {
    return InString.indexOf(Search)+1;
  };
  this.Pos$1 = function (Search, InString, StartAt) {
    return InString.indexOf(Search,StartAt-1)+1;
  };
  this.Insert = function (Insertion, Target, Index) {
    var t = "";
    if (Insertion === "") return;
    t = Target.get();
    if (Index < 1) {
      Target.set(Insertion + t)}
     else if (Index > t.length) {
      Target.set(t + Insertion)}
     else Target.set($mod.Copy(t,1,Index - 1) + Insertion + $mod.Copy(t,Index,t.length));
  };
  this.upcase = function (c) {
    return c.toUpperCase();
  };
  this.binstr = function (val, cnt) {
    var Result = "";
    var i = 0;
    Result = rtl.strSetLength(Result,cnt);
    for (var $l = cnt; $l >= 1; $l--) {
      i = $l;
      Result = rtl.setCharAt(Result,i - 1,String.fromCharCode(48 + (val & 1)));
      val = Math.floor(val / 2);
    };
    return Result;
  };
  this.val = function (S, NI, Code) {
    NI.set($impl.valint(S,-9007199254740991,9007199254740991,Code));
  };
  this.val$1 = function (S, NI, Code) {
    var x = 0.0;
    if (S === "") {
      Code.set(1);
      return;
    };
    x = Number(S);
    if (isNaN(x) || (x !== $mod.Int(x)) || (x < 0)) {
      Code.set(1)}
     else {
      Code.set(0);
      NI.set($mod.Trunc(x));
    };
  };
  this.val$2 = function (S, SI, Code) {
    SI.set($impl.valint(S,-128,127,Code));
  };
  this.val$3 = function (S, B, Code) {
    B.set($impl.valint(S,0,255,Code));
  };
  this.val$4 = function (S, SI, Code) {
    SI.set($impl.valint(S,-32768,32767,Code));
  };
  this.val$5 = function (S, W, Code) {
    W.set($impl.valint(S,0,65535,Code));
  };
  this.val$6 = function (S, I, Code) {
    I.set($impl.valint(S,-2147483648,2147483647,Code));
  };
  this.val$7 = function (S, C, Code) {
    C.set($impl.valint(S,0,4294967295,Code));
  };
  this.val$8 = function (S, d, Code) {
    var x = 0.0;
    if (S === "") {
      Code.set(1);
      return;
    };
    x = Number(S);
    if (isNaN(x)) {
      Code.set(1)}
     else {
      Code.set(0);
      d.set(x);
    };
  };
  this.val$9 = function (S, b, Code) {
    if ($impl.SameText(S,"true")) {
      Code.set(0);
      b.set(true);
    } else if ($impl.SameText(S,"false")) {
      Code.set(0);
      b.set(false);
    } else Code.set(1);
  };
  this.StringOfChar = function (c, l) {
    var Result = "";
    var i = 0;
    if ((l>0) && c.repeat) return c.repeat(l);
    Result = "";
    for (var $l = 1, $end = l; $l <= $end; $l++) {
      i = $l;
      Result = Result + c;
    };
    return Result;
  };
  this.Write = function () {
    var i = 0;
    for (var $l = 0, $end = arguments.length - 1; $l <= $end; $l++) {
      i = $l;
      if ($impl.WriteCallBack != null) {
        $impl.WriteCallBack(arguments[i],false)}
       else $impl.WriteBuf = $impl.WriteBuf + ("" + arguments[i]);
    };
  };
  this.Writeln = function () {
    var i = 0;
    var l = 0;
    var s = "";
    l = arguments.length - 1;
    if ($impl.WriteCallBack != null) {
      for (var $l = 0, $end = l; $l <= $end; $l++) {
        i = $l;
        $impl.WriteCallBack(arguments[i],i === l);
      };
    } else {
      s = $impl.WriteBuf;
      for (var $l1 = 0, $end1 = l; $l1 <= $end1; $l1++) {
        i = $l1;
        s = s + ("" + arguments[i]);
      };
      console.log(s);
      $impl.WriteBuf = "";
    };
  };
  this.$rtti.$RefToProcVar("TConsoleHandler",{procsig: rtl.newTIProcSig([["S",rtl.jsvalue],["NewLine",rtl.boolean]])});
  this.SetWriteCallBack = function (H) {
    var Result = null;
    Result = $impl.WriteCallBack;
    $impl.WriteCallBack = H;
    return Result;
  };
  this.Assigned = function (V) {
    return (V!=undefined) && (V!=null) && (!rtl.isArray(V) || (V.length > 0));
  };
  this.StrictEqual = function (A, B) {
    return A === B;
  };
  this.StrictInequal = function (A, B) {
    return A !== B;
  };
  $mod.$implcode = function () {
    $mod.$rtti.$ExtClass("TJSObj",{jsclass: "Object"});
    $mod.$rtti.$ExtClass("TJSArray",{jsclass: "Array"});
    $mod.$rtti.$ExtClass("TJSArguments",{jsclass: "arguments"});
    $impl.SameText = function (s1, s2) {
      return s1.toLowerCase() == s2.toLowerCase();
    };
    $impl.WriteBuf = "";
    $impl.WriteCallBack = null;
    $impl.valint = function (S, MinVal, MaxVal, Code) {
      var Result = 0;
      var x = 0.0;
      if (S === "") {
        Code.set(1);
        return Result;
      };
      x = Number(S);
      if (isNaN(x)) {
        var $tmp = $mod.Copy(S,1,1);
        if ($tmp === "$") {
          x = Number("0x" + $mod.Copy$1(S,2))}
         else if ($tmp === "&") {
          x = Number("0o" + $mod.Copy$1(S,2))}
         else if ($tmp === "%") {
          x = Number("0b" + $mod.Copy$1(S,2))}
         else {
          Code.set(1);
          return Result;
        };
      };
      if (isNaN(x) || (x !== $mod.Int(x))) {
        Code.set(1)}
       else if ((x < MinVal) || (x > MaxVal)) {
        Code.set(2)}
       else {
        Result = $mod.Trunc(x);
        Code.set(0);
      };
      return Result;
    };
  };
  $mod.$init = function () {
    rtl.exitcode = 0;
  };
},[]);
rtl.module("StdUtils",["System"],function () {
  "use strict";
  var $mod = this;
  this.maxlongint = 2147483647;
  this.MaxL = function (a, b) {
    var Result = 0;
    if (a > b) {
      Result = a}
     else Result = b;
    return Result;
  };
  this.MinL = function (a, b) {
    var Result = 0;
    if (a < b) {
      Result = a}
     else Result = b;
    return Result;
  };
  this.halt = function () {
    throw new Error("Legacy AI Halt");
  };
  this.Maxi = function (a, b) {
    var Result = 0;
    Result = $mod.MaxL(a,b);
    return Result;
  };
});
rtl.module("ShellWin",["System"],function () {
  "use strict";
  var $mod = this;
  rtl.createClass(this,"TShell",pas.System.TObject,function () {
    this.Write = function (s) {
    };
    this.WriteLn = function (s) {
    };
    this.GoEOT = function () {
    };
    this.ReadLn = function (s) {
      s.set("");
    };
  });
  this.shell = null;
  $mod.$init = function () {
    $mod.shell = $mod.TShell.$create("Create");
  };
});
rtl.module("RTLConsts",["System"],function () {
  "use strict";
  var $mod = this;
  $mod.$resourcestrings = {SArgumentMissing: {org: 'Missing argument in format "%s"'}, SInvalidFormat: {org: 'Invalid format specifier : "%s"'}, SInvalidArgIndex: {org: 'Invalid argument index in format: "%s"'}, SListCapacityError: {org: "List capacity (%s) exceeded."}, SListCountError: {org: "List count (%s) out of bounds."}, SMapKeyError: {org: "Key not found : %s"}, SListIndexError: {org: "List index (%s) out of bounds"}, SSortedListError: {org: "Operation not allowed on sorted list"}, SDuplicateString: {org: "String list does not allow duplicates"}, SDuplicateItem: {org: "ThreadList does not allow duplicates"}, SErrFindNeedsSortedList: {org: "Cannot use find on unsorted list"}, SInvalidName: {org: 'Invalid component name: "%s"'}, SInvalidBoolean: {org: '"%s" is not a valid boolean.'}, SDuplicateName: {org: 'Duplicate component name: "%s"'}, SErrInvalidDate: {org: 'Invalid date: "%s"'}, SErrInvalidTimeFormat: {org: 'Invalid time format: "%s"'}, SInvalidDateFormat: {org: 'Invalid date format: "%s"'}, SCantReadPropertyS: {org: 'Cannot read property "%s"'}, SCantWritePropertyS: {org: 'Cannot write property "%s"'}, SErrPropertyNotFound: {org: 'Unknown property: "%s"'}, SIndexedPropertyNeedsParams: {org: 'Indexed property "%s" needs parameters'}, SErrInvalidTypecast: {org: "Invalid class typecast"}, SErrInvalidInteger: {org: 'Invalid integer value: "%s"'}, SErrInvalidFloat: {org: 'Invalid floating-point value: "%s"'}, SInvalidDateTime: {org: "Invalid date-time value: %s"}, SInvalidCurrency: {org: "Invalid currency value: %s"}, SErrInvalidDayOfWeek: {org: "%d is not a valid day of the week"}, SErrInvalidTimeStamp: {org: 'Invalid date/timestamp : "%s"'}, SErrInvalidDateWeek: {org: "%d %d %d is not a valid dateweek"}, SErrInvalidDayOfYear: {org: "Year %d does not have a day number %d"}, SErrInvalidDateMonthWeek: {org: "Year %d, month %d, Week %d and day %d is not a valid date."}, SErrInvalidDayOfWeekInMonth: {org: "Year %d Month %d NDow %d DOW %d is not a valid date"}, SInvalidJulianDate: {org: "%f Julian cannot be represented as a DateTime"}, SErrInvalidHourMinuteSecMsec: {org: "%d:%d:%d.%d is not a valid time specification"}, SInvalidGUID: {org: '"%s" is not a valid GUID value'}, SEmptyStreamIllegalReader: {org: "Illegal Nil stream for TReader constructor"}, SInvalidPropertyValue: {org: "Invalid value for property"}, SInvalidImage: {org: "Invalid stream format"}, SUnknownProperty: {org: 'Unknown property: "%s"'}, SUnknownPropertyType: {org: "Unknown property type %s"}, SAncestorNotFound: {org: 'Ancestor class for "%s" not found.'}, SUnsupportedPropertyVariantType: {org: "Unsupported property variant type %d"}, SPropertyException: {org: "Error reading %s%s%s: %s"}, SInvalidPropertyPath: {org: "Invalid property path"}, SReadOnlyProperty: {org: "Property is read-only"}, SClassNotFound: {org: 'Class "%s" not found'}, SEmptyStreamIllegalWriter: {org: "Illegal Nil stream for TWriter constructor"}, SErrInvalidPropertyType: {org: "Invalid property type from streamed property: %d"}, SParserExpected: {org: "Wrong token type: %s expected"}, SParserInvalidFloat: {org: "Invalid floating point number: %s"}, SParserInvalidInteger: {org: "Invalid integer number: %s"}, SParserUnterminatedString: {org: "Unterminated string"}, SParserWrongTokenType: {org: "Wrong token type: %s expected but %s found"}, SParserWrongTokenSymbol: {org: "Wrong token symbol: %s expected but %s found"}, SParserLocInfo: {org: " (at %d,%d, stream offset %.8x)"}, SParserUnterminatedBinValue: {org: "Unterminated byte value"}, SParserInvalidProperty: {org: "Invalid property"}, SRangeError: {org: "Range error"}, SParamIsNegative: {org: 'Parameter "%s" cannot be negative.'}, SErrNoStreaming: {org: 'Failed to initialize component class "%s": No streaming method available.'}, SResNotFound: {org: "Resource %s not found"}, SErrResourceStreamNoWrite: {org: "Cannot write to resource stream"}, SErrResourceNotBase64: {org: "Resource %s is not base64 encoded"}, SErrUnknownResourceEncoding: {org: 'Unknown encoding for resource: "%s"'}};
});
rtl.module("Math",["System"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.MinInteger = -0xfffffffffffff - 1;
  this.MaxInteger = 0xfffffffffffff;
  this.MinDouble = 5.0e-324;
  this.MaxDouble = 1.7e+308;
  this.Epsilon = 1.1e-10;
  this.InRange = function (AValue, AMin, AMax) {
    return (AValue >= AMin) && (AValue <= AMax);
  };
  this.InRange$1 = function (AValue, AMin, AMax) {
    return (AValue >= AMin) && (AValue <= AMax);
  };
  this.EnsureRange = function (AValue, AMin, AMax) {
    if (AValue<AMin){ return AMin;
    } else if (AValue>AMax){ return AMax;
    } else return AValue;
  };
  this.EnsureRange$1 = function (AValue, AMin, AMax) {
    if (AValue<AMin){ return AMin;
    } else if (AValue>AMax){ return AMax;
    } else return AValue;
  };
  this.$rtti.$Int("TRoundToRange",{minvalue: -37, maxvalue: 37, ordtype: 0});
  this.RoundTo = function (AValue, Digits) {
    var Result = 0.0;
    var RV = 0.0;
    RV = $mod.IntPower(10,Digits);
    Result = Math.round(AValue / RV) * RV;
    return Result;
  };
  this.SimpleRoundTo = function (AValue, Digits) {
    var Result = 0.0;
    var RV = 0.0;
    RV = $mod.IntPower(10,-Digits);
    if (AValue < 0) {
      Result = pas.System.Int((AValue * RV) - 0.5) / RV}
     else Result = pas.System.Int((AValue * RV) + 0.5) / RV;
    return Result;
  };
  this.randg = function (mean, stddev) {
    var Result = 0.0;
    var U1 = 0.0;
    var S2 = 0.0;
    do {
      U1 = (2 * Math.random()) - 1;
      S2 = pas.System.Sqr$1(U1) + pas.System.Sqr$1((2 * Math.random()) - 1);
    } while (!(S2 < 1));
    Result = (Math.sqrt((-2 * Math.log(S2)) / S2) * U1 * stddev) + mean;
    return Result;
  };
  this.RandomRange = function (aFrom, aTo) {
    var Result = 0;
    Result = pas.System.Random(Math.abs(aFrom - aTo)) + Math.min(aTo,aFrom);
    return Result;
  };
  this.RandomRange$1 = function (aFrom, aTo) {
    var Result = 0;
    var m = 0;
    if (aFrom < aTo) {
      m = aFrom}
     else m = aTo;
    Result = pas.System.Random(Math.abs(aFrom - aTo)) + m;
    return Result;
  };
  this.$rtti.$Int("TValueSign",{minvalue: -1, maxvalue: 1, ordtype: 0});
  this.NegativeValue = -1;
  this.ZeroValue = 0;
  this.PositiveValue = 1;
  this.IsZero = function (d, Epsilon) {
    var Result = false;
    if (Epsilon === 0) Epsilon = 1E-12;
    Result = Math.abs(d) <= Epsilon;
    return Result;
  };
  this.IsZero$1 = function (d) {
    var Result = false;
    Result = Math.abs(d) <= 1E-12;
    return Result;
  };
  this.IsInfinite = function (d) {
    return (d==Infinity) || (d==-Infinity);
  };
  this.SameValue = function (A, B, Epsilon) {
    var Result = false;
    if (Epsilon === 0.0) Epsilon = Math.max(Math.min(Math.abs(A),Math.abs(B)) * 1E-12,1E-12);
    if (A > B) {
      Result = (A - B) <= Epsilon}
     else Result = (B - A) <= Epsilon;
    return Result;
  };
  this.SinCos = function (A, B, C) {
    B.set(Math.sin(A));
    C.set(Math.cos(A));
  };
  this.LogN = function (Base, N) {
    var Result = 0.0;
    Result = Math.log(N) / Math.log(Base);
    return Result;
  };
  this.Ceil = function (A) {
    var Result = 0;
    Result = pas.System.Trunc(Math.ceil(A));
    return Result;
  };
  this.Floor = function (A) {
    var Result = 0;
    Result = pas.System.Trunc(Math.floor(A));
    return Result;
  };
  this.Ceil64 = function (A) {
    var Result = 0;
    Result = pas.System.Trunc(Math.ceil(A));
    return Result;
  };
  this.Floor64 = function (A) {
    var Result = 0;
    Result = pas.System.Trunc(Math.ceil(A));
    return Result;
  };
  this.ldexp = function (x, p) {
    var Result = 0.0;
    Result = x * $mod.IntPower(2.0,p);
    return Result;
  };
  this.Frexp = function (X, Mantissa, Exponent) {
    Exponent.set(0);
    if (X !== 0) if (Math.abs(X) < 0.5) {
      do {
        X = X * 2;
        Exponent.set(Exponent.get() - 1);
      } while (!(Math.abs(X) >= 0.5))}
     else while (Math.abs(X) >= 1) {
      X = X / 2;
      Exponent.set(Exponent.get() + 1);
    };
    Mantissa.set(X);
  };
  this.lnxp1 = function (x) {
    var Result = 0.0;
    var y = 0.0;
    if (x >= 4.0) {
      Result = Math.log(1.0 + x)}
     else {
      y = 1.0 + x;
      if (y === 1.0) {
        Result = x}
       else {
        Result = Math.log(y);
        if (y > 0.0) Result = Result + ((x - (y - 1.0)) / y);
      };
    };
    return Result;
  };
  this.IntPower = function (base, exponent) {
    var Result = 0.0;
    var i = 0;
    if ((base === 0.0) && (exponent === 0)) {
      Result = 1}
     else {
      i = Math.abs(exponent);
      Result = 1.0;
      while (i > 0) {
        while ((i & 1) === 0) {
          i = i >>> 1;
          base = pas.System.Sqr$1(base);
        };
        i = i - 1;
        Result = Result * base;
      };
      if (exponent < 0) Result = 1.0 / Result;
    };
    return Result;
  };
  this.DivMod = function (Dividend, Divisor, Result, Remainder) {
    if (Dividend < 0) {
      Dividend = -Dividend;
      Result.set(-rtl.trunc(Dividend / Divisor));
      Remainder.set(-(Dividend + (Result.get() * Divisor)));
    } else {
      Result.set(rtl.trunc(Dividend / Divisor));
      Remainder.set(Dividend - (Result.get() * Divisor));
    };
  };
  this.DivMod$1 = function (Dividend, Divisor, Result, Remainder) {
    if (Dividend < 0) {
      Dividend = -Dividend;
      Result.set(-rtl.trunc(Dividend / Divisor));
      Remainder.set(-(Dividend + (Result.get() * Divisor)));
    } else {
      Result.set(rtl.trunc(Dividend / Divisor));
      Remainder.set(Dividend - (Result.get() * Divisor));
    };
  };
  this.DivMod$2 = function (Dividend, Divisor, Result, Remainder) {
    Result.set(rtl.trunc(Dividend / Divisor));
    Remainder.set(Dividend - (Result.get() * Divisor));
  };
  this.DivMod$3 = function (Dividend, Divisor, Result, Remainder) {
    if (Dividend < 0) {
      Dividend = -Dividend;
      Result.set(-rtl.trunc(Dividend / Divisor));
      Remainder.set(-(Dividend + (Result.get() * Divisor)));
    } else {
      Result.set(rtl.trunc(Dividend / Divisor));
      Remainder.set(Dividend - (Result.get() * Divisor));
    };
  };
  this.DegToRad = function (deg) {
    var Result = 0.0;
    Result = deg * (Math.PI / 180.0);
    return Result;
  };
  this.RadToDeg = function (rad) {
    var Result = 0.0;
    Result = rad * (180.0 / Math.PI);
    return Result;
  };
  this.GradToRad = function (grad) {
    var Result = 0.0;
    Result = grad * (Math.PI / 200.0);
    return Result;
  };
  this.RadToGrad = function (rad) {
    var Result = 0.0;
    Result = rad * (200.0 / Math.PI);
    return Result;
  };
  this.DegToGrad = function (deg) {
    var Result = 0.0;
    Result = deg * (200.0 / 180.0);
    return Result;
  };
  this.GradToDeg = function (grad) {
    var Result = 0.0;
    Result = grad * (180.0 / 200.0);
    return Result;
  };
  this.CycleToRad = function (cycle) {
    var Result = 0.0;
    Result = 2 * Math.PI * cycle;
    return Result;
  };
  this.RadToCycle = function (rad) {
    var Result = 0.0;
    Result = rad * (1 / (2 * Math.PI));
    return Result;
  };
  this.DegNormalize = function (deg) {
    var Result = 0.0;
    Result = deg - (pas.System.Int(deg / 360) * 360);
    if (Result < 0) Result = Result + 360;
    return Result;
  };
  this.Norm = function (data) {
    var Result = 0.0;
    Result = Math.sqrt($impl.sumofsquares(data));
    return Result;
  };
  this.Mean = function (data) {
    var Result = 0.0;
    var N = 0;
    N = rtl.length(data);
    if (N === 0) {
      Result = 0}
     else Result = $mod.Sum(data) / N;
    return Result;
  };
  this.Sum = function (data) {
    var Result = 0.0;
    var i = 0;
    var N = 0;
    N = rtl.length(data);
    Result = 0.0;
    for (var $l = 0, $end = N - 1; $l <= $end; $l++) {
      i = $l;
      Result = Result + data[i];
    };
    return Result;
  };
  this.SumsAndSquares = function (data, Sum, SumOfSquares) {
    var i = 0;
    var n = 0;
    var t = 0.0;
    var s = 0.0;
    var ss = 0.0;
    n = rtl.length(data);
    ss = 0.0;
    s = 0.0;
    for (var $l = 0, $end = n - 1; $l <= $end; $l++) {
      i = $l;
      t = data[i];
      ss = ss + pas.System.Sqr$1(t);
      s = s + t;
    };
    Sum.set(s);
    SumOfSquares.set(ss);
  };
  this.StdDev = function (data) {
    var Result = 0.0;
    Result = Math.sqrt($mod.Variance(data));
    return Result;
  };
  this.MeanAndStdDev = function (data, Mean, StdDev) {
    var I = 0;
    var N = 0;
    var M = 0.0;
    var S = 0.0;
    N = rtl.length(data);
    M = 0;
    S = 0;
    for (var $l = 0, $end = N - 1; $l <= $end; $l++) {
      I = $l;
      M = M + data[I];
      S = S + pas.System.Sqr$1(data[I]);
    };
    M = M / N;
    S = S - (N * pas.System.Sqr$1(M));
    if (N > 1) {
      S = Math.sqrt(S / (N - 1))}
     else S = 0;
    Mean.set(M);
    StdDev.set(S);
  };
  this.Variance = function (data) {
    var Result = 0.0;
    var n = 0;
    n = rtl.length(data);
    if (n === 1) {
      Result = 0}
     else Result = $mod.TotalVariance(data) / (n - 1);
    return Result;
  };
  this.TotalVariance = function (data) {
    var Result = 0.0;
    var S = 0.0;
    var SS = 0.0;
    var N = 0;
    N = rtl.length(data);
    if (rtl.length(data) === 1) {
      Result = 0}
     else {
      $mod.SumsAndSquares(data,{get: function () {
          return S;
        }, set: function (v) {
          S = v;
        }},{get: function () {
          return SS;
        }, set: function (v) {
          SS = v;
        }});
      Result = SS - (pas.System.Sqr$1(S) / N);
    };
    return Result;
  };
  this.PopNStdDev = function (data) {
    var Result = 0.0;
    Result = Math.sqrt($mod.PopNVariance(data));
    return Result;
  };
  this.PopNVariance = function (data) {
    var Result = 0.0;
    var N = 0;
    N = rtl.length(data);
    if (N === 0) {
      Result = 0}
     else Result = $mod.TotalVariance(data) / N;
    return Result;
  };
  this.MomentSkewKurtosis = function (data, m1, m2, m3, m4, skew, kurtosis) {
    var i = 0;
    var N = 0;
    var deviation = 0.0;
    var deviation2 = 0.0;
    var reciprocalN = 0.0;
    var lm1 = 0.0;
    var lm2 = 0.0;
    var lm3 = 0.0;
    var lm4 = 0.0;
    var lskew = 0.0;
    var lkurtosis = 0.0;
    N = rtl.length(data);
    lm1 = 0;
    reciprocalN = 1 / N;
    for (var $l = 0, $end = N - 1; $l <= $end; $l++) {
      i = $l;
      lm1 = lm1 + data[i];
    };
    lm1 = reciprocalN * lm1;
    lm2 = 0;
    lm3 = 0;
    lm4 = 0;
    for (var $l1 = 0, $end1 = N - 1; $l1 <= $end1; $l1++) {
      i = $l1;
      deviation = data[i] - lm1;
      deviation2 = deviation * deviation;
      lm2 = lm2 + deviation2;
      lm3 = lm3 + (deviation2 * deviation);
      lm4 = lm4 + (deviation2 * deviation2);
    };
    lm2 = reciprocalN * lm2;
    lm3 = reciprocalN * lm3;
    lm4 = reciprocalN * lm4;
    lskew = lm3 / (Math.sqrt(lm2) * lm2);
    lkurtosis = lm4 / (lm2 * lm2);
    m1.set(lm1);
    m2.set(lm2);
    m3.set(lm3);
    m4.set(lm4);
    skew.set(lskew);
    kurtosis.set(lkurtosis);
  };
  this.MaxIntValue = function (AData) {
    var Result = 0;
    var lCount = 0;
    Result = AData[0];
    for (var $l = 1, $end = rtl.length(AData) - 1; $l <= $end; $l++) {
      lCount = $l;
      if (Result < AData[lCount]) Result = AData[lCount];
    };
    return Result;
  };
  this.TPaymentTime = {"0": "ptEndOfPeriod", ptEndOfPeriod: 0, "1": "ptStartOfPeriod", ptStartOfPeriod: 1};
  this.$rtti.$Enum("TPaymentTime",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TPaymentTime});
  this.FutureValue = function (ARate, NPeriods, APayment, APresentValue, APaymentTime) {
    var Result = 0.0;
    var q = 0.0;
    var qn = 0.0;
    var factor = 0.0;
    if (ARate === 0) {
      Result = -APresentValue - (APayment * NPeriods)}
     else {
      q = 1.0 + ARate;
      qn = Math.pow(q,NPeriods);
      factor = (qn - 1) / (q - 1);
      if (APaymentTime === $mod.TPaymentTime.ptStartOfPeriod) factor = factor * q;
      Result = -((APresentValue * qn) + (APayment * factor));
    };
    return Result;
  };
  var DELTA = 0.001;
  var EPS = 1E-9;
  var MAXIT = 20;
  this.InterestRate = function (NPeriods, APayment, APresentValue, AFutureValue, APaymentTime) {
    var Result = 0.0;
    var r1 = 0.0;
    var r2 = 0.0;
    var dr = 0.0;
    var fv1 = 0.0;
    var fv2 = 0.0;
    var iteration = 0;
    iteration = 0;
    r1 = 0.05;
    do {
      r2 = r1 + 1E-3;
      fv1 = $mod.FutureValue(r1,NPeriods,APayment,APresentValue,APaymentTime);
      fv2 = $mod.FutureValue(r2,NPeriods,APayment,APresentValue,APaymentTime);
      dr = ((AFutureValue - fv1) / (fv2 - fv1)) * 1E-3;
      r1 = r1 + dr;
      iteration += 1;
    } while (!((Math.abs(dr) < 1E-9) || (iteration >= 20)));
    Result = r1;
    return Result;
  };
  this.NumberOfPeriods = function (ARate, APayment, APresentValue, AFutureValue, APaymentTime) {
    var Result = 0.0;
    var q = 0.0;
    var x1 = 0.0;
    var x2 = 0.0;
    if (ARate === 0) {
      Result = -(APresentValue + AFutureValue) / APayment}
     else {
      q = 1.0 + ARate;
      if (APaymentTime === $mod.TPaymentTime.ptStartOfPeriod) APayment = APayment * q;
      x1 = APayment - (AFutureValue * ARate);
      x2 = APayment + (APresentValue * ARate);
      if ((x2 === 0) || ((Math.sign(x1) * Math.sign(x2)) < 0)) {
        Result = Infinity}
       else {
        Result = Math.log(x1 / x2) / Math.log(q);
      };
    };
    return Result;
  };
  this.Payment = function (ARate, NPeriods, APresentValue, AFutureValue, APaymentTime) {
    var Result = 0.0;
    var q = 0.0;
    var qn = 0.0;
    var factor = 0.0;
    if (ARate === 0) {
      Result = -(AFutureValue + APresentValue) / NPeriods}
     else {
      q = 1.0 + ARate;
      qn = Math.pow(q,NPeriods);
      factor = (qn - 1) / (q - 1);
      if (APaymentTime === $mod.TPaymentTime.ptStartOfPeriod) factor = factor * q;
      Result = -(AFutureValue + (APresentValue * qn)) / factor;
    };
    return Result;
  };
  this.PresentValue = function (ARate, NPeriods, APayment, AFutureValue, APaymentTime) {
    var Result = 0.0;
    var q = 0.0;
    var qn = 0.0;
    var factor = 0.0;
    if (ARate === 0.0) {
      Result = -AFutureValue - (APayment * NPeriods)}
     else {
      q = 1.0 + ARate;
      qn = Math.pow(q,NPeriods);
      factor = (qn - 1) / (q - 1);
      if (APaymentTime === $mod.TPaymentTime.ptStartOfPeriod) factor = factor * q;
      Result = -(AFutureValue + (APayment * factor)) / qn;
    };
    return Result;
  };
  this.IfThen = function (val, ifTrue, ifFalse) {
    var Result = 0;
    if (val) {
      Result = ifTrue}
     else Result = ifFalse;
    return Result;
  };
  this.IfThen$1 = function (val, ifTrue, ifFalse) {
    var Result = 0.0;
    if (val) {
      Result = ifTrue}
     else Result = ifFalse;
    return Result;
  };
  this.$rtti.$Int("TValueRelationship",{minvalue: -1, maxvalue: 1, ordtype: 0});
  this.EqualsValue = 0;
  this.LessThanValue = -1;
  this.GreaterThanValue = 1;
  this.CompareValue = function (A, B) {
    var Result = 0;
    Result = 1;
    if (A === B) {
      Result = 0}
     else if (A < B) Result = -1;
    return Result;
  };
  this.CompareValue$1 = function (A, B) {
    var Result = 0;
    Result = 1;
    if (A === B) {
      Result = 0}
     else if (A < B) Result = -1;
    return Result;
  };
  this.CompareValue$2 = function (A, B) {
    var Result = 0;
    Result = 1;
    if (A === B) {
      Result = 0}
     else if (A < B) Result = -1;
    return Result;
  };
  this.CompareValue$3 = function (A, B, delta) {
    var Result = 0;
    Result = 1;
    if (Math.abs(A - B) <= delta) {
      Result = 0}
     else if (A < B) Result = -1;
    return Result;
  };
  $mod.$implcode = function () {
    $impl.DZeroResolution = 1E-12;
    $impl.sumofsquares = function (data) {
      var Result = 0.0;
      var i = 0;
      var N = 0;
      N = rtl.length(data);
      Result = 0.0;
      for (var $l = 0, $end = N - 1; $l <= $end; $l++) {
        i = $l;
        Result = Result + pas.System.Sqr$1(data[i]);
      };
      return Result;
    };
  };
},[]);
rtl.module("Types",["System"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.Epsilon = 1E-40;
  this.Epsilon2 = 1E-30;
  this.cPI = 3.141592654;
  this.cPIdiv180 = 0.017453292;
  this.cPIdiv2 = 1.570796326;
  this.cPIdiv4 = 0.785398163;
  this.TDirection = {"0": "FromBeginning", FromBeginning: 0, "1": "FromEnd", FromEnd: 1};
  this.$rtti.$Enum("TDirection",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TDirection});
  this.$rtti.$DynArray("TBooleanDynArray",{eltype: rtl.boolean});
  this.$rtti.$DynArray("TWordDynArray",{eltype: rtl.word});
  this.$rtti.$DynArray("TIntegerDynArray",{eltype: rtl.longint});
  this.$rtti.$DynArray("TNativeIntDynArray",{eltype: rtl.nativeint});
  this.$rtti.$DynArray("TStringDynArray",{eltype: rtl.string});
  this.$rtti.$DynArray("TDoubleDynArray",{eltype: rtl.double});
  this.$rtti.$DynArray("TJSValueDynArray",{eltype: rtl.jsvalue});
  this.$rtti.$DynArray("TObjectDynArray",{eltype: pas.System.$rtti["TObject"]});
  this.$rtti.$DynArray("TByteDynArray",{eltype: rtl.byte});
  this.TSplitRectType = {"0": "srLeft", srLeft: 0, "1": "srRight", srRight: 1, "2": "srTop", srTop: 2, "3": "srBottom", srBottom: 3};
  this.$rtti.$Enum("TSplitRectType",{minvalue: 0, maxvalue: 3, ordtype: 1, enumtype: this.TSplitRectType});
  this.TDuplicates = {"0": "dupIgnore", dupIgnore: 0, "1": "dupAccept", dupAccept: 1, "2": "dupError", dupError: 2};
  this.$rtti.$Enum("TDuplicates",{minvalue: 0, maxvalue: 2, ordtype: 1, enumtype: this.TDuplicates});
  this.$rtti.$RefToProcVar("TProc",{procsig: rtl.newTIProcSig([])});
  this.$rtti.$RefToProcVar("TProcString",{procsig: rtl.newTIProcSig([["aString",rtl.string,2]])});
  this.$rtti.$MethodVar("TListCallback",{procsig: rtl.newTIProcSig([["data",rtl.jsvalue],["arg",rtl.jsvalue]]), methodkind: 0});
  this.$rtti.$ProcVar("TListStaticCallback",{procsig: rtl.newTIProcSig([["data",rtl.jsvalue],["arg",rtl.jsvalue]])});
  rtl.recNewT(this,"TSize",function () {
    this.cx = 0;
    this.cy = 0;
    this.$eq = function (b) {
      return (this.cx === b.cx) && (this.cy === b.cy);
    };
    this.$assign = function (s) {
      this.cx = s.cx;
      this.cy = s.cy;
      return this;
    };
    this.Create = function (ax, ay) {
      this.cx = ax;
      this.cy = ay;
      return this;
    };
    this.Create$1 = function (asz) {
      this.cx = asz.cx;
      this.cy = asz.cy;
      return this;
    };
    this.Add = function (asz) {
      var Result = $mod.TSize.$new();
      Result.cx = this.cx + asz.cx;
      Result.cy = this.cy + asz.cy;
      return Result;
    };
    this.Distance = function (asz) {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr(this.cx - asz.cx) + pas.System.Sqr(this.cy - asz.cy));
      return Result;
    };
    this.IsZero = function () {
      var Result = false;
      Result = (this.cx === 0) && (this.cy === 0);
      return Result;
    };
    this.Subtract = function (asz) {
      var Result = $mod.TSize.$new();
      Result.cx = this.cx - asz.cx;
      Result.cy = this.cy - asz.cy;
      return Result;
    };
    var $r = $mod.$rtti.$Record("TSize",{},this);
    $r.addField("cx",rtl.longint);
    $r.addField("cy",rtl.longint);
    $r.addMethod("Create",2,[["ax",rtl.longint],["ay",rtl.longint]]);
    $r.addMethod("Create$1",2,[["asz",$r]]);
    $r.addMethod("Add",1,[["asz",$r,2]],2,$r);
    $r.addMethod("Distance",1,[["asz",$r,2]],2,rtl.double);
    $r.addMethod("IsZero",1,[],2,rtl.boolean);
    $r.addMethod("Subtract",1,[["asz",$r,2]],2,$r);
    $r.addProperty("Width",0,rtl.longint,"cx","cx",2);
    $r.addProperty("Height",0,rtl.longint,"cy","cy",2);
  });
  rtl.recNewT(this,"TPoint",function () {
    this.X = 0;
    this.Y = 0;
    this.$eq = function (b) {
      return (this.X === b.X) && (this.Y === b.Y);
    };
    this.$assign = function (s) {
      this.X = s.X;
      this.Y = s.Y;
      return this;
    };
    this.Zero = function () {
      var Result = $mod.TPoint.$new();
      Result.X = 0;
      Result.Y = 0;
      return Result;
    };
    this.Add = function (apt) {
      var Result = $mod.TPoint.$new();
      Result.X = this.X + apt.X;
      Result.Y = this.Y + apt.Y;
      return Result;
    };
    this.Distance = function (apt) {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr$1(apt.X - this.X) + pas.System.Sqr$1(apt.Y - this.Y));
      return Result;
    };
    this.IsZero = function () {
      var Result = false;
      Result = (this.X === 0) && (this.Y === 0);
      return Result;
    };
    this.Subtract = function (apt) {
      var Result = $mod.TPoint.$new();
      Result.X = this.X - apt.X;
      Result.Y = this.Y - apt.Y;
      return Result;
    };
    this.SetLocation = function (apt) {
      this.X = apt.X;
      this.Y = apt.Y;
    };
    this.SetLocation$1 = function (ax, ay) {
      this.X = ax;
      this.Y = ay;
    };
    this.Offset = function (apt) {
      this.X = this.X + apt.X;
      this.Y = this.Y + apt.Y;
    };
    this.Offset$1 = function (dx, dy) {
      this.X = this.X + dx;
      this.Y = this.Y + dy;
    };
    this.Angle = function (pt) {
      var $Self = this;
      var Result = 0.0;
      function arctan2(y, x) {
        var Result = 0.0;
        if (x === 0) {
          if (y === 0) {
            Result = 0.0}
           else if (y > 0) {
            Result = Math.PI / 2}
           else Result = -Math.PI / 2;
        } else {
          Result = Math.atan(y / x);
          if (x < 0) if (y < 0) {
            Result = Result - Math.PI}
           else Result = Result + Math.PI;
        };
        return Result;
      };
      Result = arctan2(this.Y - pt.Y,this.X - pt.X);
      return Result;
    };
    this.PointInCircle = function (apt, acenter, aradius) {
      var Result = false;
      Result = apt.Distance(acenter) <= aradius;
      return Result;
    };
    var $r = $mod.$rtti.$Record("TPoint",{},this);
    $r.addField("X",rtl.longint);
    $r.addField("Y",rtl.longint);
    $r.addMethod("Zero",5,[],2,$r,1);
    $r.addMethod("Add",1,[["apt",$r,2]],2,$r);
    $r.addMethod("Distance",1,[["apt",$r,2]],2,rtl.double);
    $r.addMethod("IsZero",1,[],2,rtl.boolean);
    $r.addMethod("Subtract",1,[["apt",$r,2]],2,$r);
    $r.addMethod("SetLocation",0,[["apt",$r,2]]);
    $r.addMethod("SetLocation$1",0,[["ax",rtl.longint],["ay",rtl.longint]]);
    $r.addMethod("Offset",0,[["apt",$r,2]]);
    $r.addMethod("Offset$1",0,[["dx",rtl.longint],["dy",rtl.longint]]);
    $r.addMethod("Angle",1,[["pt",$r,2]],2,rtl.double);
    $r.addMethod("PointInCircle",5,[["apt",$r,2],["acenter",$r,2],["aradius",rtl.longint,2]],2,rtl.boolean,1);
  });
  this.$rtti.$Pointer("PPoint",{reftype: this.$rtti["TPoint"]});
  rtl.recNewT(this,"TRect",function () {
    this.Left = 0;
    this.Top = 0;
    this.Right = 0;
    this.Bottom = 0;
    this.$eq = function (b) {
      return (this.Left === b.Left) && (this.Top === b.Top) && (this.Right === b.Right) && (this.Bottom === b.Bottom);
    };
    this.$assign = function (s) {
      this.Left = s.Left;
      this.Top = s.Top;
      this.Right = s.Right;
      this.Bottom = s.Bottom;
      return this;
    };
    this.GetBottomRight = function () {
      var Result = $mod.TPoint.$new();
      Result.$assign($mod.Point(this.Right,this.Bottom));
      return Result;
    };
    this.getHeight = function () {
      var Result = 0;
      Result = this.Bottom - this.Top;
      return Result;
    };
    this.getLocation = function () {
      var Result = $mod.TPoint.$new();
      Result.X = this.Left;
      Result.Y = this.Top;
      return Result;
    };
    this.getSize = function () {
      var Result = $mod.TSize.$new();
      Result.cx = this.getWidth();
      Result.cy = this.getHeight();
      return Result;
    };
    this.GetTopLeft = function () {
      var Result = $mod.TPoint.$new();
      Result.$assign($mod.Point(this.Left,this.Top));
      return Result;
    };
    this.getWidth = function () {
      var Result = 0;
      Result = this.Right - this.Left;
      return Result;
    };
    this.SetBottomRight = function (aValue) {
      this.Bottom = aValue.Y;
      this.Right = aValue.X;
    };
    this.setHeight = function (AValue) {
      this.Bottom = this.Top + AValue;
    };
    this.setSize = function (AValue) {
      this.Bottom = this.Top + AValue.cy;
      this.Right = this.Left + AValue.cx;
    };
    this.SetTopLeft = function (aValue) {
      this.Top = aValue.Y;
      this.Left = aValue.X;
    };
    this.setWidth = function (AValue) {
      this.Right = this.Left + AValue;
    };
    this.Create = function (Origin) {
      this.SetTopLeft(Origin);
      this.SetBottomRight(Origin);
      return this;
    };
    this.Create$1 = function (Origin, AWidth, AHeight) {
      this.SetTopLeft(Origin);
      this.setWidth(AWidth);
      this.setHeight(AHeight);
      return this;
    };
    this.Create$2 = function (ALeft, ATop, ARight, ABottom) {
      this.Left = ALeft;
      this.Top = ATop;
      this.Right = ARight;
      this.Bottom = ABottom;
      return this;
    };
    this.Create$3 = function (P1, P2, Normalize) {
      this.SetTopLeft(P1);
      this.SetBottomRight(P2);
      if (Normalize) this.NormalizeRect();
      return this;
    };
    this.Create$4 = function (R, Normalize) {
      this.$assign(R);
      if (Normalize) this.NormalizeRect();
      return this;
    };
    this.Empty = function () {
      var Result = $mod.TRect.$new();
      Result.$assign($mod.TRect.$new().Create$2(0,0,0,0));
      return Result;
    };
    this.NormalizeRect = function () {
      var x = 0;
      if (this.Top > this.Bottom) {
        x = this.Top;
        this.Top = this.Bottom;
        this.Bottom = x;
      };
      if (this.Left > this.Right) {
        x = this.Left;
        this.Left = this.Right;
        this.Right = x;
      };
    };
    this.IsEmpty = function () {
      var Result = false;
      Result = (this.Right <= this.Left) || (this.Bottom <= this.Top);
      return Result;
    };
    this.Contains = function (Pt) {
      var Result = false;
      Result = (this.Left <= Pt.X) && (Pt.X < this.Right) && (this.Top <= Pt.Y) && (Pt.Y < this.Bottom);
      return Result;
    };
    this.Contains$1 = function (R) {
      var Result = false;
      Result = (this.Left <= R.Left) && (R.Right <= this.Right) && (this.Top <= R.Top) && (R.Bottom <= this.Bottom);
      return Result;
    };
    this.IntersectsWith = function (R) {
      var Result = false;
      Result = (this.Left < R.Right) && (R.Left < this.Right) && (this.Top < R.Bottom) && (R.Top < this.Bottom);
      return Result;
    };
    this.Intersect = function (R1, R2) {
      var Result = $mod.TRect.$new();
      $mod.IntersectRect(Result,R1,R2);
      return Result;
    };
    this.Intersect$1 = function (R) {
      this.$assign(this.Intersect($mod.TRect.$clone(this),$mod.TRect.$clone(R)));
    };
    this.Union = function (R1, R2) {
      var Result = $mod.TRect.$new();
      $mod.UnionRect(Result,R1,R2);
      return Result;
    };
    this.Union$1 = function (R) {
      this.$assign(this.Union($mod.TRect.$clone(this),$mod.TRect.$clone(R)));
    };
    this.Union$2 = function (Points) {
      var Result = $mod.TRect.$new();
      var i = 0;
      if (rtl.length(Points) > 0) {
        Result.SetTopLeft(Points[0]);
        Result.SetBottomRight(Points[0]);
        for (var $l = 1, $end = rtl.length(Points) - 1; $l <= $end; $l++) {
          i = $l;
          if (Points[i].X < Result.Left) Result.Left = Points[i].X;
          if (Points[i].X > Result.Right) Result.Right = Points[i].X;
          if (Points[i].Y < Result.Top) Result.Top = Points[i].Y;
          if (Points[i].Y > Result.Bottom) Result.Bottom = Points[i].Y;
        };
      } else Result.$assign($mod.TRect.Empty());
      return Result;
    };
    this.Offset = function (DX, DY) {
      $mod.OffsetRect(this,DX,DY);
    };
    this.Offset$1 = function (DP) {
      $mod.OffsetRect(this,DP.X,DP.Y);
    };
    this.SetLocation = function (X, Y) {
      this.Offset(X - this.Left,Y - this.Top);
    };
    this.SetLocation$1 = function (P) {
      this.SetLocation(P.X,P.Y);
    };
    this.Inflate = function (DX, DY) {
      $mod.InflateRect(this,DX,DY);
    };
    this.Inflate$1 = function (DL, DT, DR, DB) {
      this.Left -= DL;
      this.Top -= DT;
      this.Right += DR;
      this.Bottom += DB;
    };
    this.CenterPoint = function () {
      var Result = $mod.TPoint.$new();
      Result.X = rtl.trunc((this.Right - this.Left) / 2) + this.Left;
      Result.Y = rtl.trunc((this.Bottom - this.Top) / 2) + this.Top;
      return Result;
    };
    this.SplitRect = function (SplitType, ASize) {
      var Result = $mod.TRect.$new();
      Result.$assign(this);
      var $tmp = SplitType;
      if ($tmp === $mod.TSplitRectType.srLeft) {
        Result.Right = this.Left + ASize}
       else if ($tmp === $mod.TSplitRectType.srRight) {
        Result.Left = this.Right - ASize}
       else if ($tmp === $mod.TSplitRectType.srTop) {
        Result.Bottom = this.Top + ASize}
       else if ($tmp === $mod.TSplitRectType.srBottom) Result.Top = this.Bottom - ASize;
      return Result;
    };
    this.SplitRect$1 = function (SplitType, Percent) {
      var Result = $mod.TRect.$new();
      Result.$assign(this);
      var $tmp = SplitType;
      if ($tmp === $mod.TSplitRectType.srLeft) {
        Result.Right = this.Left + pas.System.Trunc(Percent * this.getWidth())}
       else if ($tmp === $mod.TSplitRectType.srRight) {
        Result.Left = this.Right - pas.System.Trunc(Percent * this.getWidth())}
       else if ($tmp === $mod.TSplitRectType.srTop) {
        Result.Bottom = this.Top + pas.System.Trunc(Percent * this.getHeight())}
       else if ($tmp === $mod.TSplitRectType.srBottom) Result.Top = this.Bottom - pas.System.Trunc(Percent * this.getHeight());
      return Result;
    };
    var $r = $mod.$rtti.$Record("TRect",{},this);
    $r.addMethod("Create",2,[["Origin",$mod.$rtti["TPoint"]]]);
    $r.addMethod("Create$1",2,[["Origin",$mod.$rtti["TPoint"]],["AWidth",rtl.longint],["AHeight",rtl.longint]]);
    $r.addMethod("Create$2",2,[["ALeft",rtl.longint],["ATop",rtl.longint],["ARight",rtl.longint],["ABottom",rtl.longint]]);
    $r.addMethod("Create$3",2,[["P1",$mod.$rtti["TPoint"]],["P2",$mod.$rtti["TPoint"]],["Normalize",rtl.boolean]]);
    $r.addMethod("Create$4",2,[["R",$r],["Normalize",rtl.boolean]]);
    $r.addMethod("Empty",5,[],2,$r,1);
    $r.addMethod("NormalizeRect",0,[]);
    $r.addMethod("IsEmpty",1,[],2,rtl.boolean);
    $r.addMethod("Contains",1,[["Pt",$mod.$rtti["TPoint"]]],2,rtl.boolean);
    $r.addMethod("Contains$1",1,[["R",$r]],2,rtl.boolean);
    $r.addMethod("IntersectsWith",1,[["R",$r]],2,rtl.boolean);
    $r.addMethod("Intersect",5,[["R1",$r],["R2",$r]],2,$r,1);
    $r.addMethod("Intersect$1",0,[["R",$r]]);
    $r.addMethod("Union",5,[["R1",$r],["R2",$r]],2,$r,1);
    $r.addMethod("Union$1",0,[["R",$r]]);
    $r.addMethod("Union$2",5,[["Points",$mod.$rtti["TPoint"],10]],2,$r,1);
    $r.addMethod("Offset",0,[["DX",rtl.longint],["DY",rtl.longint]]);
    $r.addMethod("Offset$1",0,[["DP",$mod.$rtti["TPoint"]]]);
    $r.addMethod("SetLocation",0,[["X",rtl.longint],["Y",rtl.longint]]);
    $r.addMethod("SetLocation$1",0,[["P",$mod.$rtti["TPoint"]]]);
    $r.addMethod("Inflate",0,[["DX",rtl.longint],["DY",rtl.longint]]);
    $r.addMethod("Inflate$1",0,[["DL",rtl.longint],["DT",rtl.longint],["DR",rtl.longint],["DB",rtl.longint]]);
    $r.addMethod("CenterPoint",1,[],2,$mod.$rtti["TPoint"]);
    $r.addMethod("SplitRect",1,[["SplitType",$mod.$rtti["TSplitRectType"]],["ASize",rtl.longint]],2,$r);
    $r.addMethod("SplitRect$1",1,[["SplitType",$mod.$rtti["TSplitRectType"]],["Percent",rtl.double]],2,$r);
    $r.addField("Left",rtl.longint);
    $r.addField("Top",rtl.longint);
    $r.addField("Right",rtl.longint);
    $r.addField("Bottom",rtl.longint);
    $r.addProperty("Height",3,rtl.longint,"getHeight","setHeight",2);
    $r.addProperty("Width",3,rtl.longint,"getWidth","setWidth",2);
    $r.addProperty("Size",3,$mod.$rtti["TSize"],"getSize","setSize",2);
    $r.addProperty("Location",3,$mod.$rtti["TPoint"],"getLocation","SetLocation$1",2);
    $r.addProperty("TopLeft",3,$mod.$rtti["TPoint"],"GetTopLeft","SetTopLeft",2);
    $r.addProperty("BottomRight",3,$mod.$rtti["TPoint"],"GetBottomRight","SetBottomRight",2);
  });
  this.$rtti.$Pointer("PRect",{reftype: this.$rtti["TRect"]});
  this.$rtti.$Pointer("PPointF",{reftype: this.$rtti["TPointF"]});
  rtl.recNewT(this,"TPointF",function () {
    this.x = 0.0;
    this.y = 0.0;
    this.$eq = function (b) {
      return (this.x === b.x) && (this.y === b.y);
    };
    this.$assign = function (s) {
      this.x = s.x;
      this.y = s.y;
      return this;
    };
    this.Add = function (apt) {
      var Result = $mod.TPointF.$new();
      Result.x = this.x + apt.X;
      Result.y = this.y + apt.Y;
      return Result;
    };
    this.Add$1 = function (apt) {
      var Result = $mod.TPointF.$new();
      Result.x = this.x + apt.x;
      Result.y = this.y + apt.y;
      return Result;
    };
    this.Distance = function (apt) {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr$1(apt.x - this.x) + pas.System.Sqr$1(apt.y - this.y));
      return Result;
    };
    this.DotProduct = function (apt) {
      var Result = 0.0;
      Result = (this.x * apt.x) + (this.y * apt.y);
      return Result;
    };
    this.IsZero = function () {
      var Result = false;
      Result = pas.Math.SameValue(this.x,0.0,0.0) && pas.Math.SameValue(this.y,0.0,0.0);
      return Result;
    };
    this.Subtract = function (apt) {
      var Result = $mod.TPointF.$new();
      Result.x = this.x - apt.x;
      Result.y = this.y - apt.y;
      return Result;
    };
    this.Subtract$1 = function (apt) {
      var Result = $mod.TPointF.$new();
      Result.x = this.x - apt.X;
      Result.y = this.y - apt.Y;
      return Result;
    };
    this.SetLocation = function (apt) {
      this.x = apt.x;
      this.y = apt.y;
    };
    this.SetLocation$1 = function (apt) {
      this.x = apt.X;
      this.y = apt.Y;
    };
    this.SetLocation$2 = function (ax, ay) {
      this.x = ax;
      this.y = ay;
    };
    this.Offset = function (apt) {
      this.x = this.x + apt.x;
      this.y = this.y + apt.y;
    };
    this.Offset$1 = function (apt) {
      this.x = this.x + apt.X;
      this.y = this.y + apt.Y;
    };
    this.Offset$2 = function (dx, dy) {
      this.x = this.x + dx;
      this.y = this.y + dy;
    };
    this.EqualsTo = function (apt, aEpsilon) {
      var $Self = this;
      var Result = false;
      function Eq(a, b) {
        var Result = false;
        Result = Math.abs(a - b) <= aEpsilon;
        return Result;
      };
      Result = Eq(this.x,apt.x) && Eq(this.y,apt.y);
      return Result;
    };
    this.EqualsTo$1 = function (apt) {
      var Result = false;
      Result = this.EqualsTo(apt,0);
      return Result;
    };
    this.Scale = function (afactor) {
      var Result = $mod.TPointF.$new();
      Result.x = afactor * this.x;
      Result.y = afactor * this.y;
      return Result;
    };
    this.Ceiling = function () {
      var Result = $mod.TPoint.$new();
      Result.X = pas.Math.Ceil(this.x);
      Result.Y = pas.Math.Ceil(this.y);
      return Result;
    };
    this.Truncate = function () {
      var Result = $mod.TPoint.$new();
      Result.X = pas.System.Trunc(this.x);
      Result.Y = pas.System.Trunc(this.y);
      return Result;
    };
    this.Floor = function () {
      var Result = $mod.TPoint.$new();
      Result.X = pas.Math.Floor(this.x);
      Result.Y = pas.Math.Floor(this.y);
      return Result;
    };
    this.Round = function () {
      var Result = $mod.TPoint.$new();
      Result.X = Math.round(this.x);
      Result.Y = Math.round(this.y);
      return Result;
    };
    this.Length = function () {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr$1(this.x) + pas.System.Sqr$1(this.y));
      return Result;
    };
    this.Rotate = function (angle) {
      var Result = $mod.TPointF.$new();
      var sina = 0.0;
      var cosa = 0.0;
      pas.Math.SinCos(angle,{get: function () {
          return sina;
        }, set: function (v) {
          sina = v;
        }},{get: function () {
          return cosa;
        }, set: function (v) {
          cosa = v;
        }});
      Result.x = (this.x * cosa) - (this.y * sina);
      Result.y = (this.x * sina) + (this.y * cosa);
      return Result;
    };
    this.Reflect = function (normal) {
      var Result = $mod.TPointF.$new();
      var lCross = 0.0;
      var lTmp = $mod.TPointF.$new();
      lCross = (this.x * normal.x) + (this.y * normal.y);
      lCross = lCross * -2;
      lTmp.x = normal.x * lCross;
      lTmp.y = normal.y * lCross;
      Result.x = this.x + lTmp.x;
      Result.y = this.y + lTmp.y;
      return Result;
    };
    this.MidPoint = function (b) {
      var Result = $mod.TPointF.$new();
      Result.x = 0.5 * (this.x + b.x);
      Result.y = 0.5 * (this.y + b.y);
      return Result;
    };
    this.PointInCircle = function (pt, center, radius) {
      var Result = false;
      Result = (pas.System.Sqr$1(center.x - pt.x) + pas.System.Sqr$1(center.y - pt.y)) < pas.System.Sqr$1(radius);
      return Result;
    };
    this.PointInCircle$1 = function (pt, center, radius) {
      var Result = false;
      Result = (pas.System.Sqr$1(center.x - pt.x) + pas.System.Sqr$1(center.y - pt.y)) < pas.System.Sqr$1(radius);
      return Result;
    };
    this.Zero = function () {
      var Result = $mod.TPointF.$new();
      Result.x = 0;
      Result.y = 0;
      return Result;
    };
    this.Angle = function (b) {
      var Result = 0.0;
      Result = Math.atan2(this.y - b.y,this.x - b.x);
      return Result;
    };
    this.AngleCosine = function (b) {
      var Result = 0.0;
      var lCross = 0.0;
      lCross = (this.x * b.x) + (this.y * b.y);
      Result = pas.Math.EnsureRange$1(lCross / Math.sqrt((pas.System.Sqr$1(this.x) + pas.System.Sqr$1(this.y)) * (pas.System.Sqr$1(b.x) + pas.System.Sqr$1(b.y))),-1,1);
      return Result;
    };
    this.CrossProduct = function (apt) {
      var Result = 0.0;
      Result = (this.x * apt.y) - (this.y * apt.x);
      return Result;
    };
    this.Normalize = function () {
      var Result = $mod.TPointF.$new();
      var L = 0.0;
      L = Math.sqrt(pas.System.Sqr$1(this.x) + pas.System.Sqr$1(this.y));
      if (pas.Math.SameValue(L,0,1.1E-10)) {
        Result.$assign(this)}
       else {
        Result.x = this.x / L;
        Result.y = this.y / L;
      };
      return Result;
    };
    this.ToString = function (aSize, aDecimals) {
      var Result = "";
      var Sx = "";
      var Sy = "";
      Sx = $impl.SingleToStr(this.x,aSize,aDecimals);
      Sy = $impl.SingleToStr(this.y,aSize,aDecimals);
      Result = "(" + Sx + "," + Sy + ")";
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = this.ToString(8,2);
      return Result;
    };
    this.Create = function (ax, ay) {
      var Result = $mod.TPointF.$new();
      Result.x = ax;
      Result.y = ay;
      return Result;
    };
    this.Create$1 = function (apt) {
      var Result = $mod.TPointF.$new();
      Result.x = apt.X;
      Result.y = apt.Y;
      return Result;
    };
    var $r = $mod.$rtti.$Record("TPointF",{},this);
    $r.addField("x",rtl.double);
    $r.addField("y",rtl.double);
    $r.addMethod("Add",1,[["apt",$mod.$rtti["TPoint"],2]],2,$r);
    $r.addMethod("Add$1",1,[["apt",$r,2]],2,$r);
    $r.addMethod("Distance",1,[["apt",$r,2]],2,rtl.double);
    $r.addMethod("DotProduct",1,[["apt",$r,2]],2,rtl.double);
    $r.addMethod("IsZero",1,[],2,rtl.boolean);
    $r.addMethod("Subtract",1,[["apt",$r,2]],2,$r);
    $r.addMethod("Subtract$1",1,[["apt",$mod.$rtti["TPoint"],2]],2,$r);
    $r.addMethod("SetLocation",0,[["apt",$r,2]]);
    $r.addMethod("SetLocation$1",0,[["apt",$mod.$rtti["TPoint"],2]]);
    $r.addMethod("SetLocation$2",0,[["ax",rtl.double],["ay",rtl.double]]);
    $r.addMethod("Offset",0,[["apt",$r,2]]);
    $r.addMethod("Offset$1",0,[["apt",$mod.$rtti["TPoint"],2]]);
    $r.addMethod("Offset$2",0,[["dx",rtl.double],["dy",rtl.double]]);
    $r.addMethod("EqualsTo",1,[["apt",$r,2],["aEpsilon",rtl.double,2]],2,rtl.boolean);
    $r.addMethod("EqualsTo$1",1,[["apt",$r,2]],2,rtl.boolean);
    $r.addMethod("Scale",1,[["afactor",rtl.double]],2,$r);
    $r.addMethod("Ceiling",1,[],2,$mod.$rtti["TPoint"]);
    $r.addMethod("Truncate",1,[],2,$mod.$rtti["TPoint"]);
    $r.addMethod("Floor",1,[],2,$mod.$rtti["TPoint"]);
    $r.addMethod("Round",1,[],2,$mod.$rtti["TPoint"]);
    $r.addMethod("Length",1,[],2,rtl.double);
    $r.addMethod("Rotate",1,[["angle",rtl.double]],2,$r);
    $r.addMethod("Reflect",1,[["normal",$r,2]],2,$r);
    $r.addMethod("MidPoint",1,[["b",$r,2]],2,$r);
    $r.addMethod("PointInCircle",5,[["pt",$r,2],["center",$r,2],["radius",rtl.double]],2,rtl.boolean,1);
    $r.addMethod("PointInCircle$1",5,[["pt",$r,2],["center",$r,2],["radius",rtl.longint]],2,rtl.boolean,1);
    $r.addMethod("Zero",5,[],2,$r,1);
    $r.addMethod("Angle",1,[["b",$r,2]],2,rtl.double);
    $r.addMethod("AngleCosine",1,[["b",$r,2]],2,rtl.double);
    $r.addMethod("CrossProduct",1,[["apt",$r,2]],2,rtl.double);
    $r.addMethod("Normalize",1,[],2,$r);
    $r.addMethod("ToString",1,[["aSize",rtl.byte],["aDecimals",rtl.byte]],2,rtl.string);
    $r.addMethod("ToString$1",1,[],2,rtl.string);
    $r.addMethod("Create",5,[["ax",rtl.double,2],["ay",rtl.double,2]],2,$r,1);
    $r.addMethod("Create$1",5,[["apt",$mod.$rtti["TPoint"],2]],2,$r,1);
  });
  this.$rtti.$Pointer("PSizeF",{reftype: this.$rtti["TSizeF"]});
  rtl.recNewT(this,"TSizeF",function () {
    this.cx = 0.0;
    this.cy = 0.0;
    this.$eq = function (b) {
      return (this.cx === b.cx) && (this.cy === b.cy);
    };
    this.$assign = function (s) {
      this.cx = s.cx;
      this.cy = s.cy;
      return this;
    };
    this.Add = function (asz) {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.cx + asz.cx;
      Result.cy = this.cy + asz.cy;
      return Result;
    };
    this.Add$1 = function (asz) {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.cx + asz.cx;
      Result.cy = this.cy + asz.cy;
      return Result;
    };
    this.Distance = function (asz) {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr$1(asz.cx - this.cx) + pas.System.Sqr$1(asz.cy - this.cy));
      return Result;
    };
    this.IsZero = function () {
      var Result = false;
      Result = pas.Math.SameValue(this.cx,0.0,0.0) && pas.Math.SameValue(this.cy,0.0,0.0);
      return Result;
    };
    this.Subtract = function (asz) {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.cx - asz.cx;
      Result.cy = this.cy - asz.cy;
      return Result;
    };
    this.Subtract$1 = function (asz) {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.cx - asz.cx;
      Result.cy = this.cy - asz.cy;
      return Result;
    };
    this.SwapDimensions = function () {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.cy;
      Result.cy = this.cx;
      return Result;
    };
    this.Scale = function (afactor) {
      var Result = $mod.TSizeF.$new();
      Result.cx = afactor * this.cx;
      Result.cy = afactor * this.cy;
      return Result;
    };
    this.Ceiling = function () {
      var Result = $mod.TSize.$new();
      Result.cx = pas.Math.Ceil(this.cx);
      Result.cy = pas.Math.Ceil(this.cy);
      return Result;
    };
    this.Truncate = function () {
      var Result = $mod.TSize.$new();
      Result.cx = pas.System.Trunc(this.cx);
      Result.cy = pas.System.Trunc(this.cy);
      return Result;
    };
    this.Floor = function () {
      var Result = $mod.TSize.$new();
      Result.cx = pas.Math.Floor(this.cx);
      Result.cy = pas.Math.Floor(this.cy);
      return Result;
    };
    this.Round = function () {
      var Result = $mod.TSize.$new();
      Result.cx = Math.round(this.cx);
      Result.cy = Math.round(this.cy);
      return Result;
    };
    this.Length = function () {
      var Result = 0.0;
      Result = Math.sqrt(pas.System.Sqr$1(this.cx) + pas.System.Sqr$1(this.cy));
      return Result;
    };
    this.ToString = function (aSize, aDecimals) {
      var Result = "";
      var Sx = "";
      var Sy = "";
      Sx = $impl.SingleToStr(this.cx,aSize,aDecimals);
      Sy = $impl.SingleToStr(this.cy,aSize,aDecimals);
      Result = "(" + Sx + "x" + Sy + ")";
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = this.ToString(8,2);
      return Result;
    };
    this.Create = function (ax, ay) {
      var Result = $mod.TSizeF.$new();
      Result.cx = ax;
      Result.cy = ay;
      return Result;
    };
    this.Create$1 = function (asz) {
      var Result = $mod.TSizeF.$new();
      Result.cx = asz.cx;
      Result.cy = asz.cy;
      return Result;
    };
    var $r = $mod.$rtti.$Record("TSizeF",{},this);
    $r.addField("cx",rtl.double);
    $r.addField("cy",rtl.double);
    $r.addMethod("Add",1,[["asz",$mod.$rtti["TSize"],2]],2,$r);
    $r.addMethod("Add$1",1,[["asz",$r,2]],2,$r);
    $r.addMethod("Distance",1,[["asz",$r,2]],2,rtl.double);
    $r.addMethod("IsZero",1,[],2,rtl.boolean);
    $r.addMethod("Subtract",1,[["asz",$r,2]],2,$r);
    $r.addMethod("Subtract$1",1,[["asz",$mod.$rtti["TSize"],2]],2,$r);
    $r.addMethod("SwapDimensions",1,[],2,$r);
    $r.addMethod("Scale",1,[["afactor",rtl.double]],2,$r);
    $r.addMethod("Ceiling",1,[],2,$mod.$rtti["TSize"]);
    $r.addMethod("Truncate",1,[],2,$mod.$rtti["TSize"]);
    $r.addMethod("Floor",1,[],2,$mod.$rtti["TSize"]);
    $r.addMethod("Round",1,[],2,$mod.$rtti["TSize"]);
    $r.addMethod("Length",1,[],2,rtl.double);
    $r.addMethod("ToString",1,[["aSize",rtl.byte],["aDecimals",rtl.byte]],2,rtl.string);
    $r.addMethod("ToString$1",1,[],2,rtl.string);
    $r.addMethod("Create",5,[["ax",rtl.double,2],["ay",rtl.double,2]],2,$r,1);
    $r.addMethod("Create$1",5,[["asz",$mod.$rtti["TSize"],2]],2,$r,1);
    $r.addProperty("Width",0,rtl.double,"cx","cx",2);
    $r.addProperty("Height",0,rtl.double,"cy","cy",2);
  });
  this.TVertRectAlign = {"0": "Center", Center: 0, "1": "Top", Top: 1, "2": "Bottom", Bottom: 2};
  this.$rtti.$Enum("TVertRectAlign",{minvalue: 0, maxvalue: 2, ordtype: 1, enumtype: this.TVertRectAlign});
  this.THorzRectAlign = {"0": "Center", Center: 0, "1": "Left", Left: 1, "2": "Right", Right: 2};
  this.$rtti.$Enum("THorzRectAlign",{minvalue: 0, maxvalue: 2, ordtype: 1, enumtype: this.THorzRectAlign});
  this.$rtti.$Pointer("PRectF",{reftype: this.$rtti["TRectF"]});
  rtl.recNewT(this,"TRectF",function () {
    this.Left = 0.0;
    this.Top = 0.0;
    this.Right = 0.0;
    this.Bottom = 0.0;
    this.$eq = function (b) {
      return (this.Left === b.Left) && (this.Top === b.Top) && (this.Right === b.Right) && (this.Bottom === b.Bottom);
    };
    this.$assign = function (s) {
      this.Left = s.Left;
      this.Top = s.Top;
      this.Right = s.Right;
      this.Bottom = s.Bottom;
      return this;
    };
    this.GetBottomRight = function () {
      var Result = $mod.TPointF.$new();
      Result.$assign($mod.TPointF.Create(this.Right,this.Bottom));
      return Result;
    };
    this.GetLocation = function () {
      var Result = $mod.TPointF.$new();
      Result.x = this.Left;
      Result.y = this.Top;
      return Result;
    };
    this.GetSize = function () {
      var Result = $mod.TSizeF.$new();
      Result.cx = this.GetWidth();
      Result.cy = this.GetHeight();
      return Result;
    };
    this.GetTopLeft = function () {
      var Result = $mod.TPointF.$new();
      Result.$assign($mod.TPointF.Create(this.Left,this.Top));
      return Result;
    };
    this.SetBottomRight = function (aValue) {
      this.Right = aValue.x;
      this.Bottom = aValue.y;
    };
    this.SetSize = function (AValue) {
      this.Bottom = this.Top + AValue.cy;
      this.Right = this.Left + AValue.cx;
    };
    this.GetHeight = function () {
      var Result = 0.0;
      Result = this.Bottom - this.Top;
      return Result;
    };
    this.GetWidth = function () {
      var Result = 0.0;
      Result = this.Right - this.Left;
      return Result;
    };
    this.SetHeight = function (AValue) {
      this.Bottom = this.Top + AValue;
    };
    this.SetTopLeft = function (aValue) {
      this.Left = aValue.x;
      this.Top = aValue.y;
    };
    this.SetWidth = function (AValue) {
      this.Right = this.Left + AValue;
    };
    this.Create = function (Origin) {
      this.SetTopLeft(Origin);
      this.SetBottomRight(Origin);
      return this;
    };
    this.Create$1 = function (Origin, AWidth, AHeight) {
      this.SetTopLeft(Origin);
      this.SetWidth(AWidth);
      this.SetHeight(AHeight);
      return this;
    };
    this.Create$2 = function (ALeft, ATop, ARight, ABottom) {
      this.Left = ALeft;
      this.Top = ATop;
      this.Right = ARight;
      this.Bottom = ABottom;
      return this;
    };
    this.Create$3 = function (P1, P2, Normalize) {
      this.SetTopLeft(P1);
      this.SetBottomRight(P2);
      if (Normalize) this.NormalizeRect();
      return this;
    };
    this.Create$4 = function (R, Normalize) {
      this.$assign(R);
      if (Normalize) this.NormalizeRect();
      return this;
    };
    this.Create$5 = function (R, Normalize) {
      this.Left = R.Left;
      this.Top = R.Top;
      this.Right = R.Right;
      this.Bottom = R.Bottom;
      if (Normalize) this.NormalizeRect();
      return this;
    };
    this.Empty = function () {
      var Result = $mod.TRectF.$new();
      Result.$assign($mod.TRectF.$new().Create$2(0,0,0,0));
      return Result;
    };
    this.Intersect = function (R1, R2) {
      var Result = $mod.TRectF.$new();
      Result.$assign(R1);
      if (R2.Left > R1.Left) Result.Left = R2.Left;
      if (R2.Top > R1.Top) Result.Top = R2.Top;
      if (R2.Right < R1.Right) Result.Right = R2.Right;
      if (R2.Bottom < R1.Bottom) Result.Bottom = R2.Bottom;
      return Result;
    };
    this.Union = function (Points) {
      var Result = $mod.TRectF.$new();
      var i = 0;
      if (rtl.length(Points) > 0) {
        Result.SetTopLeft(Points[0]);
        Result.SetBottomRight(Points[0]);
        for (var $l = 1, $end = rtl.length(Points) - 1; $l <= $end; $l++) {
          i = $l;
          if (Points[i].x < Result.Left) Result.Left = Points[i].x;
          if (Points[i].x > Result.Right) Result.Right = Points[i].x;
          if (Points[i].y < Result.Top) Result.Top = Points[i].y;
          if (Points[i].y > Result.Bottom) Result.Bottom = Points[i].y;
        };
      } else Result.$assign($mod.TRectF.Empty());
      return Result;
    };
    this.Union$1 = function (R1, R2) {
      var Result = $mod.TRectF.$new();
      Result.$assign(R1);
      Result.Union$2(R2);
      return Result;
    };
    this.Ceiling = function () {
      var Result = $mod.TRectF.$new();
      Result.SetBottomRight($mod.TPointF.Create(this.GetBottomRight().Ceiling().X,this.GetBottomRight().Ceiling().Y));
      Result.SetTopLeft($mod.TPointF.Create(this.GetTopLeft().Ceiling().X,this.GetTopLeft().Ceiling().Y));
      return Result;
    };
    this.CenterAt = function (Dest) {
      var Result = $mod.TRectF.$new();
      Result.$assign(this);
      $mod.RectCenter$1(Result,Dest);
      return Result;
    };
    this.CenterPoint = function () {
      var Result = $mod.TPointF.$new();
      Result.x = ((this.Right - this.Left) / 2) + this.Left;
      Result.y = ((this.Bottom - this.Top) / 2) + this.Top;
      return Result;
    };
    this.Contains = function (Pt) {
      var Result = false;
      Result = (this.Left <= Pt.x) && (Pt.x < this.Right) && (this.Top <= Pt.y) && (Pt.y < this.Bottom);
      return Result;
    };
    this.Contains$1 = function (R) {
      var Result = false;
      Result = (this.Left <= R.Left) && (R.Right <= this.Right) && (this.Top <= R.Top) && (R.Bottom <= this.Bottom);
      return Result;
    };
    this.EqualsTo = function (R, Epsilon) {
      var Result = false;
      Result = this.GetTopLeft().EqualsTo(R.GetTopLeft(),Epsilon);
      Result = Result && this.GetBottomRight().EqualsTo(R.GetBottomRight(),Epsilon);
      return Result;
    };
    this.Fit = function (Dest) {
      var Result = 0.0;
      var R = $mod.TRectF.$new();
      R.$assign(this.FitInto$1(Dest,{get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }}));
      this.$assign(R);
      return Result;
    };
    this.FitInto = function (Dest) {
      var Result = $mod.TRectF.$new();
      var Ratio = 0.0;
      Result.$assign(this.FitInto$1(Dest,{get: function () {
          return Ratio;
        }, set: function (v) {
          Ratio = v;
        }}));
      return Result;
    };
    this.FitInto$1 = function (Dest, Ratio) {
      var Result = $mod.TRectF.$new();
      if ((Dest.GetWidth() <= 0) || (Dest.GetHeight() <= 0)) {
        Ratio.set(1.0);
        return this;
      };
      Ratio.set(Math.max(this.GetWidth() / Dest.GetWidth(),this.GetHeight() / Dest.GetHeight()));
      if (Ratio.get() === 0) return this;
      Result.SetWidth(this.GetWidth() / Ratio.get());
      Result.SetHeight(this.GetHeight() / Ratio.get());
      Result.Left = this.Left + ((this.GetWidth() - Result.GetWidth()) / 2);
      Result.Top = this.Top + ((this.GetHeight() - Result.GetHeight()) / 2);
      return Result;
    };
    this.IntersectsWith = function (R) {
      var Result = false;
      Result = (this.Left < R.Right) && (R.Left < this.Right) && (this.Top < R.Bottom) && (R.Top < this.Bottom);
      return Result;
    };
    this.IsEmpty = function () {
      var Result = false;
      Result = (pas.Math.CompareValue$3(this.Right,this.Left,0.0) <= 0) || (pas.Math.CompareValue$3(this.Bottom,this.Top,0.0) <= 0);
      return Result;
    };
    this.PlaceInto = function (Dest, AHorzAlign, AVertAlign) {
      var Result = $mod.TRectF.$new();
      var R = $mod.TRectF.$new();
      var X = 0.0;
      var Y = 0.0;
      if ((this.GetHeight() > Dest.GetHeight()) || (this.GetWidth() > Dest.GetWidth())) {
        R.$assign(this.FitInto(Dest))}
       else R.$assign(this);
      var $tmp = AHorzAlign;
      if ($tmp === $mod.THorzRectAlign.Left) {
        X = Dest.Left}
       else if ($tmp === $mod.THorzRectAlign.Center) {
        X = ((Dest.Left + Dest.Right) - R.GetWidth()) / 2}
       else if ($tmp === $mod.THorzRectAlign.Right) X = Dest.Right - R.GetWidth();
      var $tmp1 = AVertAlign;
      if ($tmp1 === $mod.TVertRectAlign.Top) {
        Y = Dest.Top}
       else if ($tmp1 === $mod.TVertRectAlign.Center) {
        Y = ((Dest.Top + Dest.Bottom) - R.GetHeight()) / 2}
       else if ($tmp1 === $mod.TVertRectAlign.Bottom) Y = Dest.Bottom - R.GetHeight();
      R.SetLocation($mod.TPointF.$clone($mod.PointF(X,Y)));
      Result.$assign(R);
      return Result;
    };
    this.Round = function () {
      var Result = $mod.TRect.$new();
      Result.SetBottomRight(this.GetBottomRight().Round());
      Result.SetTopLeft(this.GetTopLeft().Round());
      return Result;
    };
    this.SnapToPixel = function (AScale, APlaceBetweenPixels) {
      var $Self = this;
      var Result = $mod.TRectF.$new();
      function sc(S) {
        var Result = 0.0;
        Result = pas.System.Trunc(S * AScale) / AScale;
        return Result;
      };
      var R = $mod.TRectF.$new();
      var Off = 0.0;
      if (AScale <= 0) AScale = 1;
      R.Top = sc(this.Top);
      R.Left = sc(this.Left);
      R.SetWidth(sc(this.GetWidth()));
      R.SetHeight(sc(this.GetHeight()));
      if (APlaceBetweenPixels) {
        Off = 1 / (2 * AScale);
        R.Offset(Off,Off);
      };
      Result.$assign(R);
      return Result;
    };
    this.Truncate = function () {
      var Result = $mod.TRect.$new();
      Result.SetBottomRight(this.GetBottomRight().Truncate());
      Result.SetTopLeft(this.GetTopLeft().Truncate());
      return Result;
    };
    this.Inflate = function (DL, DT, DR, DB) {
      this.Left = this.Left - DL;
      this.Top = this.Top - DT;
      this.Right = this.Right + DR;
      this.Bottom = this.Bottom + DB;
    };
    this.Inflate$1 = function (DX, DY) {
      this.Left = this.Left - DX;
      this.Top = this.Top - DY;
      this.Right = this.Right + DX;
      this.Bottom = this.Bottom + DY;
    };
    this.Intersect$1 = function (R) {
      this.$assign(this.Intersect($mod.TRectF.$clone(this),$mod.TRectF.$clone(R)));
    };
    this.NormalizeRect = function () {
      var x = 0.0;
      if (this.Top > this.Bottom) {
        x = this.Top;
        this.Top = this.Bottom;
        this.Bottom = x;
      };
      if (this.Left > this.Right) {
        x = this.Left;
        this.Left = this.Right;
        this.Right = x;
      };
    };
    this.Offset = function (dx, dy) {
      this.Left = this.Left + dx;
      this.Right = this.Right + dx;
      this.Bottom = this.Bottom + dy;
      this.Top = this.Top + dy;
    };
    this.Offset$1 = function (DP) {
      this.Left = this.Left + DP.x;
      this.Right = this.Right + DP.x;
      this.Bottom = this.Bottom + DP.y;
      this.Top = this.Top + DP.y;
    };
    this.SetLocation = function (P) {
      this.Offset(P.x - this.Left,P.y - this.Top);
    };
    this.ToString = function (aSize, aDecimals, aUseSize) {
      var Result = "";
      var S = "";
      if (aUseSize) {
        S = this.GetSize().ToString(aSize,aDecimals)}
       else S = this.GetBottomRight().ToString(aSize,aDecimals);
      Result = "[" + this.GetTopLeft().ToString(aSize,aDecimals) + " - " + S + "]";
      return Result;
    };
    this.ToString$1 = function (aUseSize) {
      var Result = "";
      Result = this.ToString(8,2,aUseSize);
      return Result;
    };
    this.Union$2 = function (r) {
      this.Left = Math.min(r.Left,this.Left);
      this.Top = Math.min(r.Top,this.Top);
      this.Right = Math.max(r.Right,this.Right);
      this.Bottom = Math.max(r.Bottom,this.Bottom);
    };
    var $r = $mod.$rtti.$Record("TRectF",{},this);
    $r.addField("Left",rtl.double);
    $r.addField("Top",rtl.double);
    $r.addField("Right",rtl.double);
    $r.addField("Bottom",rtl.double);
    $r.addMethod("Create",2,[["Origin",$mod.$rtti["TPointF"]]]);
    $r.addMethod("Create$1",2,[["Origin",$mod.$rtti["TPointF"]],["AWidth",rtl.double],["AHeight",rtl.double]]);
    $r.addMethod("Create$2",2,[["ALeft",rtl.double],["ATop",rtl.double],["ARight",rtl.double],["ABottom",rtl.double]]);
    $r.addMethod("Create$3",2,[["P1",$mod.$rtti["TPointF"]],["P2",$mod.$rtti["TPointF"]],["Normalize",rtl.boolean]]);
    $r.addMethod("Create$4",2,[["R",$r],["Normalize",rtl.boolean]]);
    $r.addMethod("Create$5",2,[["R",$mod.$rtti["TRect"]],["Normalize",rtl.boolean]]);
    $r.addMethod("Empty",5,[],2,$r,1);
    $r.addMethod("Intersect",5,[["R1",$r],["R2",$r]],2,$r,1);
    $r.addMethod("Union",5,[["Points",$mod.$rtti["TPointF"],10]],2,$r,1);
    $r.addMethod("Union$1",5,[["R1",$r],["R2",$r]],2,$r,1);
    $r.addMethod("Ceiling",1,[],2,$r);
    $r.addMethod("CenterAt",1,[["Dest",$r,2]],2,$r);
    $r.addMethod("CenterPoint",1,[],2,$mod.$rtti["TPointF"]);
    $r.addMethod("Contains",1,[["Pt",$mod.$rtti["TPointF"]]],2,rtl.boolean);
    $r.addMethod("Contains$1",1,[["R",$r]],2,rtl.boolean);
    $r.addMethod("EqualsTo",1,[["R",$r,2],["Epsilon",rtl.double,2]],2,rtl.boolean);
    $r.addMethod("Fit",1,[["Dest",$r,2]],2,rtl.double);
    $r.addMethod("FitInto",1,[["Dest",$r,2]],2,$r);
    $r.addMethod("FitInto$1",1,[["Dest",$r,2],["Ratio",rtl.double,4]],2,$r);
    $r.addMethod("IntersectsWith",1,[["R",$r]],2,rtl.boolean);
    $r.addMethod("IsEmpty",1,[],2,rtl.boolean);
    $r.addMethod("PlaceInto",1,[["Dest",$r,2],["AHorzAlign",$mod.$rtti["THorzRectAlign"],2],["AVertAlign",$mod.$rtti["TVertRectAlign"],2]],2,$r);
    $r.addMethod("Round",1,[],2,$mod.$rtti["TRect"]);
    $r.addMethod("SnapToPixel",1,[["AScale",rtl.double],["APlaceBetweenPixels",rtl.boolean]],2,$r);
    $r.addMethod("Truncate",1,[],2,$mod.$rtti["TRect"]);
    $r.addMethod("Inflate",0,[["DL",rtl.double],["DT",rtl.double],["DR",rtl.double],["DB",rtl.double]]);
    $r.addMethod("Inflate$1",0,[["DX",rtl.double],["DY",rtl.double]]);
    $r.addMethod("Intersect$1",0,[["R",$r]]);
    $r.addMethod("NormalizeRect",0,[]);
    $r.addMethod("Offset",0,[["dx",rtl.double,2],["dy",rtl.double,2]]);
    $r.addMethod("Offset$1",0,[["DP",$mod.$rtti["TPointF"]]]);
    $r.addMethod("SetLocation",0,[["P",$mod.$rtti["TPointF"]]]);
    $r.addMethod("ToString",1,[["aSize",rtl.byte],["aDecimals",rtl.byte],["aUseSize",rtl.boolean]],2,rtl.string);
    $r.addMethod("ToString$1",1,[["aUseSize",rtl.boolean]],2,rtl.string);
    $r.addMethod("Union$2",0,[["r",$r,2]]);
    $r.addProperty("Width",3,rtl.double,"GetWidth","SetWidth",2);
    $r.addProperty("Height",3,rtl.double,"GetHeight","SetHeight",2);
    $r.addProperty("Size",3,$mod.$rtti["TSizeF"],"GetSize","SetSize",2);
    $r.addProperty("Location",3,$mod.$rtti["TPointF"],"GetLocation","SetLocation",2);
    $r.addProperty("TopLeft",3,$mod.$rtti["TPointF"],"GetTopLeft","SetTopLeft",2);
    $r.addProperty("BottomRight",3,$mod.$rtti["TPointF"],"GetBottomRight","SetBottomRight",2);
  });
  rtl.recNewT(this,"TPoint3D",function () {
    this.x = 0.0;
    this.y = 0.0;
    this.z = 0.0;
    this.$eq = function (b) {
      return (this.x === b.x) && (this.y === b.y) && (this.z === b.z);
    };
    this.$assign = function (s) {
      this.x = s.x;
      this.y = s.y;
      this.z = s.z;
      return this;
    };
    this.GetSingle3Array = function () {
      var Result = rtl.arraySetLength(null,0.0,3);
      Result = [this.x,this.y,this.z];
      return Result;
    };
    this.SetSingle3Array = function (aValue) {
      this.x = aValue[0];
      this.y = aValue[1];
      this.z = aValue[2];
    };
    this.Create = function (ax, ay, az) {
      this.x = ax;
      this.y = ay;
      this.z = az;
      return this;
    };
    this.Offset = function (adeltax, adeltay, adeltaz) {
      this.x = this.x + adeltax;
      this.y = this.y + adeltay;
      this.z = this.z + adeltaz;
    };
    this.Offset$1 = function (adelta) {
      this.x = this.x + adelta.x;
      this.y = this.y + adelta.y;
      this.z = this.z + adelta.z;
    };
    this.ToString = function (aSize, aDecimals) {
      var Result = "";
      var Sx = "";
      var Sy = "";
      var Sz = "";
      Sx = $impl.SingleToStr(this.x,aSize,aDecimals);
      Sy = $impl.SingleToStr(this.y,aSize,aDecimals);
      Sz = $impl.SingleToStr(this.z,aSize,aDecimals);
      Result = "(" + Sx + "," + Sy + "," + Sz + ")";
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = this.ToString(8,2);
      return Result;
    };
    var $r = $mod.$rtti.$Record("TPoint3D",{},this);
    $mod.$rtti.$StaticArray("TPoint3D.TSingle3Array",{dims: [3], eltype: rtl.double});
    $r.addMethod("Create",2,[["ax",rtl.double,2],["ay",rtl.double,2],["az",rtl.double,2]]);
    $r.addMethod("Offset",0,[["adeltax",rtl.double,2],["adeltay",rtl.double,2],["adeltaz",rtl.double,2]]);
    $r.addMethod("Offset$1",0,[["adelta",$r,2]]);
    $r.addMethod("ToString",1,[["aSize",rtl.byte],["aDecimals",rtl.byte]],2,rtl.string);
    $r.addMethod("ToString$1",1,[],2,rtl.string);
    $r.addProperty("Data",3,$mod.$rtti["TPoint3D.TSingle3Array"],"GetSingle3Array","SetSingle3Array",2);
    $r.addField("x",rtl.double);
    $r.addField("y",rtl.double);
    $r.addField("z",rtl.double);
  });
  this.EqualRect = function (r1, r2) {
    var Result = false;
    Result = (r1.Left === r2.Left) && (r1.Right === r2.Right) && (r1.Top === r2.Top) && (r1.Bottom === r2.Bottom);
    return Result;
  };
  this.EqualRect$1 = function (r1, r2) {
    var Result = false;
    Result = r1.EqualsTo(r2,0);
    return Result;
  };
  this.Rect = function (Left, Top, Right, Bottom) {
    var Result = $mod.TRect.$new();
    Result.Left = Left;
    Result.Top = Top;
    Result.Right = Right;
    Result.Bottom = Bottom;
    return Result;
  };
  this.RectF = function (Left, Top, Right, Bottom) {
    var Result = $mod.TRectF.$new();
    Result.Left = Left;
    Result.Top = Top;
    Result.Right = Right;
    Result.Bottom = Bottom;
    return Result;
  };
  this.Bounds = function (ALeft, ATop, AWidth, AHeight) {
    var Result = $mod.TRect.$new();
    Result.Left = ALeft;
    Result.Top = ATop;
    Result.Right = ALeft + AWidth;
    Result.Bottom = ATop + AHeight;
    return Result;
  };
  this.Point = function (x, y) {
    var Result = $mod.TPoint.$new();
    Result.X = x;
    Result.Y = y;
    return Result;
  };
  this.PointF = function (x, y) {
    var Result = $mod.TPointF.$new();
    Result.x = x;
    Result.y = y;
    return Result;
  };
  this.PtInRect = function (aRect, p) {
    var Result = false;
    Result = (p.Y >= aRect.Top) && (p.Y < aRect.Bottom) && (p.X >= aRect.Left) && (p.X < aRect.Right);
    return Result;
  };
  this.IntersectRect = function (aRect, R1, R2) {
    var Result = false;
    var lRect = $mod.TRect.$new();
    lRect.$assign(R1);
    if (R2.Left > R1.Left) lRect.Left = R2.Left;
    if (R2.Top > R1.Top) lRect.Top = R2.Top;
    if (R2.Right < R1.Right) lRect.Right = R2.Right;
    if (R2.Bottom < R1.Bottom) lRect.Bottom = R2.Bottom;
    if ($mod.IsRectEmpty(lRect)) {
      aRect.$assign($mod.Rect(0,0,0,0));
      Result = false;
    } else {
      Result = true;
      aRect.$assign(lRect);
    };
    return Result;
  };
  this.IntersectRect$1 = function (Rect1, Rect2) {
    var Result = false;
    Result = (Rect1.Left < Rect2.Right) && (Rect1.Right > Rect2.Left) && (Rect1.Top < Rect2.Bottom) && (Rect1.Bottom > Rect2.Top);
    return Result;
  };
  this.IntersectRect$2 = function (Rect1, Rect2) {
    var Result = false;
    Result = (Rect1.Left < Rect2.Right) && (Rect1.Right > Rect2.Left) && (Rect1.Top < Rect2.Bottom) && (Rect1.Bottom > Rect2.Top);
    return Result;
  };
  this.IntersectRect$3 = function (aRect, R1, R2) {
    var Result = false;
    var lRect = $mod.TRectF.$new();
    lRect.$assign(R1);
    if (R2.Left > R1.Left) lRect.Left = R2.Left;
    if (R2.Top > R1.Top) lRect.Top = R2.Top;
    if (R2.Right < R1.Right) lRect.Right = R2.Right;
    if (R2.Bottom < R1.Bottom) lRect.Bottom = R2.Bottom;
    if ($mod.IsRectEmpty$1(lRect)) {
      aRect.$assign($mod.RectF(0.0,0.0,0.0,0.0));
      Result = false;
    } else {
      Result = true;
      aRect.$assign(lRect);
    };
    return Result;
  };
  this.UnionRect = function (aRect, R1, R2) {
    var Result = false;
    var lRect = $mod.TRect.$new();
    lRect.$assign(R1);
    if (R2.Left < R1.Left) lRect.Left = R2.Left;
    if (R2.Top < R1.Top) lRect.Top = R2.Top;
    if (R2.Right > R1.Right) lRect.Right = R2.Right;
    if (R2.Bottom > R1.Bottom) lRect.Bottom = R2.Bottom;
    if ($mod.IsRectEmpty(lRect)) {
      aRect.$assign($mod.Rect(0,0,0,0));
      Result = false;
    } else {
      aRect.$assign(lRect);
      Result = true;
    };
    return Result;
  };
  this.UnionRect$1 = function (aRectF, R1, R2) {
    var Result = false;
    var lRect = $mod.TRectF.$new();
    lRect.$assign(R1);
    if (R2.Left < R1.Left) lRect.Left = R2.Left;
    if (R2.Top < R1.Top) lRect.Top = R2.Top;
    if (R2.Right > R1.Right) lRect.Right = R2.Right;
    if (R2.Bottom > R1.Bottom) lRect.Bottom = R2.Bottom;
    if ($mod.IsRectEmpty$1(lRect)) {
      aRectF.$assign($mod.RectF(0.0,0.0,0.0,0.0));
      Result = false;
    } else {
      aRectF.$assign(lRect);
      Result = true;
    };
    return Result;
  };
  this.UnionRect$2 = function (R1, R2) {
    var Result = $mod.TRect.$new();
    Result.$assign($mod.TRect.$new());
    $mod.UnionRect(Result,R1,R2);
    return Result;
  };
  this.UnionRect$3 = function (R1, R2) {
    var Result = $mod.TRectF.$new();
    Result.$assign($mod.TRectF.$new());
    $mod.UnionRect$1(Result,R1,R2);
    return Result;
  };
  this.IsRectEmpty = function (aRect) {
    var Result = false;
    Result = (aRect.Right <= aRect.Left) || (aRect.Bottom <= aRect.Top);
    return Result;
  };
  this.OffsetRect = function (aRect, DX, DY) {
    var Result = false;
    aRect.Left += DX;
    aRect.Top += DY;
    aRect.Right += DX;
    aRect.Bottom += DY;
    Result = true;
    return Result;
  };
  this.OffsetRect$1 = function (aRect, DX, DY) {
    var Result = false;
    aRect.Left = aRect.Left + DX;
    aRect.Top = aRect.Top + DY;
    aRect.Right = aRect.Right + DX;
    aRect.Bottom = aRect.Bottom + DY;
    Result = true;
    return Result;
  };
  this.CenterPoint = function (aRect) {
    var Result = $mod.TPoint.$new();
    function Avg(a, b) {
      var Result = 0;
      if (a < b) {
        Result = a + ((b - a) >>> 1)}
       else Result = b + ((a - b) >>> 1);
      return Result;
    };
    Result.X = Avg(aRect.Left,aRect.Right);
    Result.Y = Avg(aRect.Top,aRect.Bottom);
    return Result;
  };
  this.InflateRect = function (aRect, dx, dy) {
    var Result = false;
    aRect.Left -= dx;
    aRect.Top -= dy;
    aRect.Right += dx;
    aRect.Bottom += dy;
    Result = true;
    return Result;
  };
  this.Size = function (AWidth, AHeight) {
    var Result = $mod.TSize.$new();
    Result.cx = AWidth;
    Result.cy = AHeight;
    return Result;
  };
  this.Size$1 = function (aRect) {
    var Result = $mod.TSize.$new();
    Result.cx = aRect.Right - aRect.Left;
    Result.cy = aRect.Bottom - aRect.Top;
    return Result;
  };
  this.RectCenter = function (R, Bounds) {
    var Result = $mod.TRect.$new();
    var C = $mod.TPoint.$new();
    var CS = $mod.TPoint.$new();
    C.$assign(Bounds.CenterPoint());
    CS.$assign(R.CenterPoint());
    $mod.OffsetRect(R,C.X - CS.X,C.Y - CS.Y);
    Result.$assign(R);
    return Result;
  };
  this.RectCenter$1 = function (R, Bounds) {
    var Result = $mod.TRectF.$new();
    var C = $mod.TPointF.$new();
    var CS = $mod.TPointF.$new();
    C.$assign(Bounds.CenterPoint());
    CS.$assign(R.CenterPoint());
    $mod.OffsetRect$1(R,C.x - CS.x,C.y - CS.y);
    Result.$assign(R);
    return Result;
  };
  this.NormalizeRectF = function (Pts) {
    var Result = $mod.TRectF.$new();
    var Pt = $mod.TPointF.$new();
    Result.Left = 0xFFFF;
    Result.Top = 0xFFFF;
    Result.Right = -0xFFFF;
    Result.Bottom = -0xFFFF;
    for (var $in = Pts, $l = 0, $end = rtl.length($in) - 1; $l <= $end; $l++) {
      Pt = $in[$l];
      Result.Left = Math.min(Pt.x,Result.Left);
      Result.Top = Math.min(Pt.y,Result.Top);
      Result.Right = Math.max(Pt.x,Result.Right);
      Result.Bottom = Math.max(Pt.y,Result.Bottom);
    };
    return Result;
  };
  this.NormalizeRect = function (ARect) {
    var Result = $mod.TRectF.$new();
    Result.$assign($mod.NormalizeRectF([$mod.TPointF.$clone($mod.PointF(ARect.Left,ARect.Top)),$mod.TPointF.$clone($mod.PointF(ARect.Right,ARect.Top)),$mod.TPointF.$clone($mod.PointF(ARect.Right,ARect.Bottom)),$mod.TPointF.$clone($mod.PointF(ARect.Left,ARect.Bottom))]));
    return Result;
  };
  this.PtInRect$1 = function (Rect, p) {
    var Result = false;
    Result = (p.y >= Rect.Top) && (p.y < Rect.Bottom) && (p.x >= Rect.Left) && (p.x < Rect.Right);
    return Result;
  };
  this.RectHeight = function (Rect) {
    var Result = 0;
    Result = Rect.getHeight();
    return Result;
  };
  this.RectHeight$1 = function (Rect) {
    var Result = 0.0;
    Result = Rect.GetHeight();
    return Result;
  };
  this.RectWidth = function (Rect) {
    var Result = 0;
    Result = Rect.getWidth();
    return Result;
  };
  this.RectWidth$1 = function (Rect) {
    var Result = 0.0;
    Result = Rect.GetWidth();
    return Result;
  };
  this.IsRectEmpty$1 = function (Rect) {
    var Result = false;
    Result = Rect.IsEmpty();
    return Result;
  };
  this.MultiplyRect = function (R, DX, DY) {
    R.Left = DX * R.Left;
    R.Right = DX * R.Right;
    R.Top = DY * R.Top;
    R.Bottom = DY * R.Bottom;
  };
  this.InflateRect$1 = function (Rect, dx, dy) {
    var Result = false;
    Result = true;
    Rect.Left = Rect.Left - dx;
    Rect.Top = Rect.Top - dy;
    Rect.Right = Rect.Right + dx;
    Rect.Bottom = Rect.Bottom + dy;
    return Result;
  };
  this.Size$2 = function (ARect) {
    var Result = $mod.TSizeF.$new();
    Result.cx = ARect.Right - ARect.Left;
    Result.cy = ARect.Bottom - ARect.Top;
    return Result;
  };
  this.ScalePoint = function (P, dX, dY) {
    var Result = $mod.TPointF.$new();
    Result.x = P.x * dX;
    Result.y = P.y * dY;
    return Result;
  };
  this.ScalePoint$1 = function (P, dX, dY) {
    var Result = $mod.TPoint.$new();
    Result.X = Math.round(P.X * dX);
    Result.Y = Math.round(P.Y * dY);
    return Result;
  };
  this.MinPoint = function (P1, P2) {
    var Result = $mod.TPointF.$new();
    Result.$assign(P1);
    if ((P2.y < P1.y) || ((P2.y === P1.y) && (P2.x < P1.x))) Result.$assign(P2);
    return Result;
  };
  this.MinPoint$1 = function (P1, P2) {
    var Result = $mod.TPoint.$new();
    Result.$assign(P1);
    if ((P2.Y < P1.Y) || ((P2.Y === P1.Y) && (P2.X < P1.X))) Result.$assign(P2);
    return Result;
  };
  this.SplitRect = function (Rect, SplitType, Size) {
    var Result = $mod.TRect.$new();
    Result.$assign(Rect.SplitRect(SplitType,Size));
    return Result;
  };
  this.SplitRect$1 = function (Rect, SplitType, Percent) {
    var Result = $mod.TRect.$new();
    Result.$assign(Rect.SplitRect$1(SplitType,Percent));
    return Result;
  };
  this.CenteredRect = function (SourceRect, aCenteredRect) {
    var Result = $mod.TRect.$new();
    var W = 0;
    var H = 0;
    var Center = $mod.TPoint.$new();
    W = aCenteredRect.getWidth();
    H = aCenteredRect.getHeight();
    Center.$assign(SourceRect.CenterPoint());
    Result.$assign($mod.Rect(Center.X - rtl.trunc(W / 2),Center.Y - rtl.trunc(H / 2),Center.X + rtl.trunc((W + 1) / 2),Center.Y + rtl.trunc((H + 1) / 2)));
    return Result;
  };
  this.IntersectRectF = function (Rect, R1, R2) {
    var Result = false;
    Result = $mod.IntersectRect$3(Rect,R1,R2);
    return Result;
  };
  this.UnionRectF = function (Rect, R1, R2) {
    var Result = false;
    Result = $mod.UnionRect$1(Rect,R1,R2);
    return Result;
  };
  $mod.$implcode = function () {
    $impl.SingleToStr = function (aValue, aSize, aDecimals) {
      var Result = "";
      var S = "";
      var Len = 0;
      var P = 0;
      S = rtl.floatToStr(aValue,aSize,aDecimals);
      Len = S.length;
      P = 1;
      while ((P <= Len) && (S.charAt(P - 1) === " ")) P += 1;
      if (P > 1) pas.System.Delete({get: function () {
          return S;
        }, set: function (v) {
          S = v;
        }},1,P - 1);
      Result = S;
      return Result;
    };
  };
},["Math"]);
rtl.module("JS",["System","Types"],function () {
  "use strict";
  var $mod = this;
  this.$rtti.$ExtClass("TJSArray");
  this.$rtti.$ExtClass("TJSMap");
  this.$rtti.$ExtClass("TJSBigInt");
  rtl.createClass(this,"EJS",pas.System.TObject,function () {
    this.$init = function () {
      pas.System.TObject.$init.call(this);
      this.FMessage = "";
    };
    this.Create$1 = function (Msg) {
      this.FMessage = Msg;
      return this;
    };
  });
  this.$rtti.$ExtClass("TJSObject",{jsclass: "Object"});
  this.$rtti.$ClassRef("TJSObjectClass",{instancetype: this.$rtti["TJSObject"]});
  this.$rtti.$DynArray("TJSObjectDynArray",{eltype: this.$rtti["TJSObject"]});
  this.$rtti.$DynArray("TJSObjectDynArrayArray",{eltype: this.$rtti["TJSObjectDynArray"]});
  this.$rtti.$DynArray("TJSStringDynArray",{eltype: rtl.string});
  this.$rtti.$ExtClass("TJSIteratorValue",{jsclass: "IteratorValue"});
  this.$rtti.$ExtClass("TJSIterator",{jsclass: "Iterator"});
  this.$rtti.$ExtClass("TJSSet");
  this.$rtti.$RefToProcVar("TJSSetEventProc",{procsig: rtl.newTIProcSig([["value",rtl.jsvalue],["key",rtl.nativeint],["set_",this.$rtti["TJSSet"]]])});
  this.$rtti.$RefToProcVar("TJSSetProcCallBack",{procsig: rtl.newTIProcSig([["value",rtl.jsvalue],["key",rtl.jsvalue]])});
  this.$rtti.$ExtClass("TJSSet",{jsclass: "Set"});
  this.$rtti.$RefToProcVar("TJSMapFunctionCallBack",{procsig: rtl.newTIProcSig([["arg",rtl.jsvalue]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSMapProcCallBack",{procsig: rtl.newTIProcSig([["value",rtl.jsvalue],["key",rtl.jsvalue]])});
  this.$rtti.$ExtClass("TJSMap",{jsclass: "Map"});
  this.$rtti.$ExtClass("TJSFunction",{ancestor: this.$rtti["TJSObject"], jsclass: "Function"});
  this.$rtti.$ExtClass("TJSDate",{ancestor: this.$rtti["TJSFunction"], jsclass: "Date"});
  this.$rtti.$ExtClass("TJSSymbol",{ancestor: this.$rtti["TJSFunction"], jsclass: "Symbol"});
  rtl.recNewT(this,"TLocaleCompareOptions",function () {
    this.localematched = "";
    this.usage = "";
    this.sensitivity = "";
    this.ignorePunctuation = false;
    this.numeric = false;
    this.caseFirst = "";
    this.$eq = function (b) {
      return (this.localematched === b.localematched) && (this.usage === b.usage) && (this.sensitivity === b.sensitivity) && (this.ignorePunctuation === b.ignorePunctuation) && (this.numeric === b.numeric) && (this.caseFirst === b.caseFirst);
    };
    this.$assign = function (s) {
      this.localematched = s.localematched;
      this.usage = s.usage;
      this.sensitivity = s.sensitivity;
      this.ignorePunctuation = s.ignorePunctuation;
      this.numeric = s.numeric;
      this.caseFirst = s.caseFirst;
      return this;
    };
    var $r = $mod.$rtti.$Record("TLocaleCompareOptions",{},this);
    $r.addField("localematched",rtl.string);
    $r.addField("usage",rtl.string);
    $r.addField("sensitivity",rtl.string);
    $r.addField("ignorePunctuation",rtl.boolean);
    $r.addField("numeric",rtl.boolean);
    $r.addField("caseFirst",rtl.string);
  });
  this.$rtti.$ExtClass("TJSRegexp",{jsclass: "RegExp"});
  this.$rtti.$RefToProcVar("TReplaceCallBack",{procsig: rtl.newTIProcSig([["match",rtl.string,2]],rtl.string,2)});
  this.$rtti.$RefToProcVar("TReplaceCallBack0",{procsig: rtl.newTIProcSig([["match",rtl.string,2],["offset",rtl.longint],["AString",rtl.string]],rtl.string)});
  this.$rtti.$RefToProcVar("TReplaceCallBack1",{procsig: rtl.newTIProcSig([["match",rtl.string,2],["p1",rtl.string,2],["offset",rtl.longint],["AString",rtl.string]],rtl.string)});
  this.$rtti.$RefToProcVar("TReplaceCallBack2",{procsig: rtl.newTIProcSig([["match",rtl.string,2],["p1",rtl.string,2],["p2",rtl.string,2],["offset",rtl.longint],["AString",rtl.string]],rtl.string)});
  this.$rtti.$ExtClass("TJSString",{jsclass: "String"});
  this.$rtti.$RefToProcVar("TJSArrayEventProc",{procsig: rtl.newTIProcSig([["element",rtl.jsvalue],["index",rtl.nativeint],["anArray",this.$rtti["TJSArray"]]])});
  this.$rtti.$RefToProcVar("TJSArrayEvent",{procsig: rtl.newTIProcSig([["element",rtl.jsvalue],["index",rtl.nativeint],["anArray",this.$rtti["TJSArray"]]],rtl.boolean)});
  this.$rtti.$RefToProcVar("TJSArrayMapEvent",{procsig: rtl.newTIProcSig([["element",rtl.jsvalue],["index",rtl.nativeint],["anArray",this.$rtti["TJSArray"]]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSArrayReduceEvent",{procsig: rtl.newTIProcSig([["accumulator",rtl.jsvalue],["currentValue",rtl.jsvalue],["currentIndex",rtl.nativeint],["anArray",this.$rtti["TJSArray"]]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSArrayCompareEvent",{procsig: rtl.newTIProcSig([["a",rtl.jsvalue],["b",rtl.jsvalue]],rtl.nativeint)});
  this.$rtti.$ExtClass("TJSArray",{jsclass: "Array"});
  this.$rtti.$ExtClass("TJSAbstractArrayBuffer",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSArrayBuffer",{ancestor: this.$rtti["TJSAbstractArrayBuffer"], jsclass: "ArrayBuffer"});
  this.$rtti.$ExtClass("TJSSharedArrayBuffer",{ancestor: this.$rtti["TJSAbstractArrayBuffer"], jsclass: "SharedArrayBuffer"});
  this.$rtti.$ExtClass("TJSBufferSource",{ancestor: this.$rtti["TJSObject"], jsclass: "BufferSource"});
  this.$rtti.$ExtClass("TJSTypedArray");
  this.$rtti.$RefToProcVar("TJSTypedArrayCallBack",{procsig: rtl.newTIProcSig([["element",rtl.jsvalue],["index",rtl.nativeint],["anArray",this.$rtti["TJSTypedArray"]]],rtl.boolean)});
  this.$rtti.$RefToProcVar("TJSTypedArrayMapCallBack",{procsig: rtl.newTIProcSig([["element",rtl.jsvalue],["index",rtl.nativeint],["anArray",this.$rtti["TJSTypedArray"]]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSTypedArrayReduceCallBack",{procsig: rtl.newTIProcSig([["accumulator",rtl.jsvalue],["currentValue",rtl.jsvalue],["currentIndex",rtl.nativeint],["anArray",this.$rtti["TJSTypedArray"]]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSTypedArrayCompareCallBack",{procsig: rtl.newTIProcSig([["a",rtl.jsvalue],["b",rtl.jsvalue]],rtl.nativeint)});
  this.$rtti.$ExtClass("TJSTypedArray",{ancestor: this.$rtti["TJSBufferSource"], jsclass: "TypedArray"});
  this.$rtti.$ClassRef("TJSTypedArrayClass",{instancetype: this.$rtti["TJSTypedArray"]});
  this.$rtti.$ExtClass("TJSInt8Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Int8Array"});
  this.$rtti.$ExtClass("TJSUint8Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Uint8Array"});
  this.$rtti.$ExtClass("TJSUint8ClampedArray",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Uint8ClampedArray"});
  this.$rtti.$ExtClass("TJSInt16Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Int16Array"});
  this.$rtti.$ExtClass("TJSUint16Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Uint16Array"});
  this.$rtti.$ExtClass("TJSInt32Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Int32Array"});
  this.$rtti.$ExtClass("TJSUint32Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Uint32Array"});
  this.$rtti.$ExtClass("TJSFloat32Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Float32Array"});
  this.$rtti.$ExtClass("TJSFloat64Array",{ancestor: this.$rtti["TJSTypedArray"], jsclass: "Float64Array"});
  this.$rtti.$ExtClass("TJSDataView",{ancestor: this.$rtti["TJSBufferSource"], jsclass: "DataView"});
  this.$rtti.$ExtClass("TJSJSON",{ancestor: this.$rtti["TJSObject"], jsclass: "JSON"});
  this.$rtti.$ExtClass("TJSError",{ancestor: this.$rtti["TJSObject"], jsclass: "Error"});
  this.$rtti.$ExtClass("TJSPromise");
  this.$rtti.$ExtClass("TJSPromiseResolvers",{jsclass: "Object"});
  this.$rtti.$RefToProcVar("TJSPromiseResolver",{procsig: rtl.newTIProcSig([["aValue",rtl.jsvalue]],rtl.jsvalue)});
  this.$rtti.$RefToProcVar("TJSPromiseExecutor",{procsig: rtl.newTIProcSig([["resolve",this.$rtti["TJSPromiseResolver"]],["reject",this.$rtti["TJSPromiseResolver"]]])});
  this.$rtti.$RefToProcVar("TJSPromiseFinallyHandler",{procsig: rtl.newTIProcSig([])});
  this.$rtti.$DynArray("TJSPromiseArray",{eltype: this.$rtti["TJSPromise"]});
  this.$rtti.$ExtClass("TJSPromise",{jsclass: "Promise"});
  this.$rtti.$ExtClass("TJSFunctionArguments",{jsclass: "arguments"});
  this.$rtti.$ExtClass("TJSIteratorResult",{ancestor: this.$rtti["TJSObject"], jsclass: "IteratorResult"});
  this.$rtti.$ExtClass("TJSAsyncIterator",{ancestor: this.$rtti["TJSObject"], jsclass: "AsyncIterator"});
  this.$rtti.$ExtClass("TJSSyntaxError",{ancestor: this.$rtti["TJSError"], jsclass: "SyntaxError"});
  this.$rtti.$ExtClass("TJSTextDecoderOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSTextDecodeOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSTextDecoder",{ancestor: this.$rtti["TJSObject"], jsclass: "TextDecoder"});
  this.$rtti.$ExtClass("TJSTextEncoderEncodeIntoResult",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSTextEncoder",{ancestor: this.$rtti["TJSObject"], jsclass: "TextEncoder"});
  this.$rtti.$ExtClass("TGGenerator<System.JSValue>",{ancestor: this.$rtti["TJSObject"], jsclass: "Generator"});
  this.$rtti.$ExtClass("TGGenerator<System.JSValue>.TGGeneratorValue",{ancestor: this.$rtti["TJSObject"], jsclass: "Generator"});
  this.$rtti.$ExtClass("TJSProxy",{ancestor: this.$rtti["TJSObject"], jsclass: "Proxy"});
  this.$rtti.$ExtClass("TJSNumber",{ancestor: this.$rtti["TJSFunction"], jsclass: "Number"});
  this.$rtti.$ExtClass("TJSBigInt",{ancestor: this.$rtti["TJSObject"], jsclass: "BigInt"});
  rtl.createHelper(this,"TJSBigIntHelper",null,function () {
    this.New = function (aValue) {
      var Result = null;
      Result = BigInt(aValue);
      return Result;
    };
  });
  this.$rtti.$ExtClass("TJSAtomicWaitResult",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSAtomics",{ancestor: this.$rtti["TJSObject"], jsclass: "Atomics"});
  this.$rtti.$ExtClass("TJSLocalesOfOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSFormatRangePart",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSFormatRangePartArray",{eltype: this.$rtti["TJSFormatRangePart"]});
  this.$rtti.$ExtClass("TJSFormatDatePart",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSFormatDatePartArray",{eltype: this.$rtti["TJSFormatDatePart"]});
  this.$rtti.$ExtClass("TJSDateTimeResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSDateLocaleOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlDateTimeFormat",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.DateTimeFormat"});
  this.$rtti.$ExtClass("TJSDisplayNamesOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlDisplayNamesResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlDisplayNames",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.DisplayNames"});
  this.$rtti.$ExtClass("TJSDurationLocaleOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSFormatDurationPart",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSFormatDurationPartArray",{eltype: this.$rtti["TJSFormatDurationPart"]});
  this.$rtti.$ExtClass("TJSDurationResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSDuration",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlDurationFormat",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.DurationFormat"});
  this.$rtti.$ExtClass("TJSListFormatOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSListFormatResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSFormatListPart",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSFormatListPartArray",{eltype: this.$rtti["TJSFormatListPart"]});
  this.$rtti.$ExtClass("TJSIntlListFormat",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.ListFormat"});
  this.$rtti.$ExtClass("TJSIntlLocaleOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlTextInfo",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlWeekInfo",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlLocale",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.Locale"});
  this.$rtti.$ExtClass("TJSNumberFormatOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSNumberFormatResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlNumberPart",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSIntlNumberPartArray",{eltype: this.$rtti["TJSIntlNumberPart"]});
  this.$rtti.$ExtClass("TJSIntlNumberFormat",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.NumberFormat"});
  this.$rtti.$ExtClass("TJSIntlCollatorOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlCollatorResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlCollator",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.Collator"});
  this.$rtti.$ExtClass("TJSIntlPluralRuleOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlPluralRuleResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlPluralRules",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.PluralRules"});
  this.$rtti.$ExtClass("TJSRelativeTimeParts",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$DynArray("TJSRelativeTimePartsArray",{eltype: this.$rtti["TJSRelativeTimeParts"]});
  this.$rtti.$ExtClass("TJSIntlRelativeTimeFormatOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlRelativeTimeFormatResolvedOptions",{ancestor: this.$rtti["TJSObject"], jsclass: "Object"});
  this.$rtti.$ExtClass("TJSIntlRelativeTimeFormat",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl.RelativeTimeFormat"});
  this.$rtti.$ExtClass("TJSIntl",{ancestor: this.$rtti["TJSObject"], jsclass: "Intl"});
  this.Symbol$1 = function () {
    return Symbol();
  };
  this.Symbol$2 = function (Description) {
    return Symbol(Description);
  };
  this.AsNumber = function (v) {
    return Number(v);
  };
  this.AsIntNumber = function (v) {
    return Number(v);
  };
  this.JSValueArrayOf = function (Args) {
    var Result = [];
    var I = 0;
    Result = rtl.arraySetLength(Result,undefined,rtl.length(Args));
    for (var $l = 0, $end = rtl.length(Args) - 1; $l <= $end; $l++) {
      I = $l;
      Result[I] = Args[I].VJSValue;
    };
    return Result;
  };
  this.New = function (aElements) {
    var Result = null;
    var L = 0;
    var I = 0;
    var S = "";
    L = rtl.length(aElements);
    if ((L % 2) === 1) throw $mod.EJS.$create("Create$1",["Number of arguments must be even"]);
    I = 0;
    while (I < L) {
      if (!rtl.isString(aElements[I])) {
        S = String(I);
        throw $mod.EJS.$create("Create$1",["Argument " + S + " must be a string."]);
      };
      I += 2;
    };
    I = 0;
    Result = new Object();
    while (I < L) {
      S = "" + aElements[I];
      Result[S] = aElements[I + 1];
      I += 2;
    };
    return Result;
  };
  this.JSDelete = function (Obj, PropName) {
    return delete Obj[PropName];
  };
  this.hasValue = function (v) {
    if(v){ return true; } else { return false; };
  };
  this.jsIn = function (keyName, object) {
    return keyName in object;
  };
  this.isBoolean = function (v) {
    return typeof(v) == 'boolean';
  };
  this.isDate = function (v) {
    return (v instanceof Date);
  };
  this.isCallback = function (v) {
    return rtl.isObject(v) && rtl.isObject(v.scope) && (rtl.isString(v.fn) || rtl.isFunction(v.fn));
  };
  this.isChar = function (v) {
    return (typeof(v)!="string") && (v.length==1);
  };
  this.isClass = function (v) {
    return (typeof(v)=="object") && (v!=null) && (v.$class == v);
  };
  this.isClassInstance = function (v) {
    return (typeof(v)=="object") && (v!=null) && (v.$class == Object.getPrototypeOf(v));
  };
  this.isInteger = function (v) {
    return Math.floor(v)===v;
  };
  this.isNull = function (v) {
    return v === null;
  };
  this.isRecord = function (v) {
    return (typeof(v)==="object")
    && (typeof(v.$new)==="function")
    && (typeof(v.$clone)==="function")
    && (typeof(v.$eq)==="function")
    && (typeof(v.$assign)==="function");
  };
  this.isBigint = function (v) {
    return typeof(v) === 'bigint';
  };
  this.isUndefined = function (v) {
    return v == undefined;
  };
  this.isDefined = function (v) {
    return !(v == undefined);
  };
  this.isUTF16Char = function (v) {
    if (typeof(v)!="string") return false;
    if ((v.length==0) || (v.length>2)) return false;
    var code = v.charCodeAt(0);
    if (code < 0xD800){
      if (v.length == 1) return true;
    } else if (code <= 0xDBFF){
      if (v.length==2){
        code = v.charCodeAt(1);
        if (code >= 0xDC00 && code <= 0xDFFF) return true;
      };
    };
    return false;
  };
  this.jsInstanceOf = function (aFunction, aFunctionWithPrototype) {
    return aFunction instanceof aFunctionWithPrototype;
  };
  this.toNumber = function (v) {
    return v-0;
  };
  this.toInteger = function (v) {
    var Result = 0;
    if ($mod.isInteger(v)) {
      Result = rtl.trunc(v)}
     else Result = 0;
    return Result;
  };
  this.toObject = function (Value) {
    var Result = null;
    if (rtl.isObject(Value)) {
      Result = Value}
     else Result = null;
    return Result;
  };
  this.toArray = function (Value) {
    var Result = null;
    if (rtl.isArray(Value)) {
      Result = Value}
     else Result = null;
    return Result;
  };
  this.toBoolean = function (Value) {
    var Result = false;
    if ($mod.isBoolean(Value)) {
      Result = !(Value == false)}
     else Result = false;
    return Result;
  };
  this.ToString = function (Value) {
    var Result = "";
    if (rtl.isString(Value)) {
      Result = "" + Value}
     else Result = "";
    return Result;
  };
  this.JSClassName = function (aObj) {
    var Result = "";
    Result = "";
    if (aObj === null) return Result;
    return aObj.constructor.name;
    return Result;
  };
  this.TJSValueType = {"0": "jvtNull", jvtNull: 0, "1": "jvtBoolean", jvtBoolean: 1, "2": "jvtInteger", jvtInteger: 2, "3": "jvtFloat", jvtFloat: 3, "4": "jvtString", jvtString: 4, "5": "jvtObject", jvtObject: 5, "6": "jvtArray", jvtArray: 6};
  this.$rtti.$Enum("TJSValueType",{minvalue: 0, maxvalue: 6, ordtype: 1, enumtype: this.TJSValueType});
  this.GetValueType = function (JS) {
    var Result = 0;
    var t = "";
    if ($mod.isNull(JS)) {
      Result = $mod.TJSValueType.jvtNull}
     else {
      t = typeof(JS);
      if (t === "string") {
        Result = $mod.TJSValueType.jvtString}
       else if (t === "boolean") {
        Result = $mod.TJSValueType.jvtBoolean}
       else if (t === "object") {
        if (rtl.isArray(JS)) {
          Result = $mod.TJSValueType.jvtArray}
         else Result = $mod.TJSValueType.jvtObject;
      } else if (t === "number") if ($mod.isInteger(JS)) {
        Result = $mod.TJSValueType.jvtInteger}
       else Result = $mod.TJSValueType.jvtFloat;
    };
    return Result;
  };
  this.HaveSharedArrayBuffer = function () {
    return (typeof SharedArrayBuffer !== 'undefined');
  };
  this.SharedToNonShared = function (aBuffer) {
    var Result = null;
    var Src = null;
    var Dest = null;
    if ($mod.HaveSharedArrayBuffer() && rtl.isExt(aBuffer,SharedArrayBuffer)) {
      Result = new ArrayBuffer(aBuffer.byteLength);
      Src = new Uint8Array(aBuffer);
      Dest = new Uint8Array(Result);
      Dest.set(Src);
    } else Result = aBuffer;
    return Result;
  };
  this.SharedToNonShared$1 = function (aArray, aWordSized) {
    var Result = null;
    var Buf = null;
    if ($mod.HaveSharedArrayBuffer() && rtl.isExt(aArray.buffer,SharedArrayBuffer)) {
      Buf = aArray.buffer.slice(aArray.byteOffset,aArray.byteOffset + aArray.byteLength);
      if (aWordSized) {
        Result = new Uint16Array($mod.SharedToNonShared(Buf))}
       else Result = new Uint8Array($mod.SharedToNonShared(Buf));
    } else Result = aArray;
    return Result;
  };
});
rtl.module("SysUtils",["System","RTLConsts","JS"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.FreeAndNil = function (Obj) {
    var o = null;
    o = Obj.get();
    if (o === null) return;
    Obj.set(null);
    o.$destroy("Destroy");
  };
  this.$rtti.$ProcVar("TProcedure",{procsig: rtl.newTIProcSig([])});
  this.FloatRecDigits = 19;
  this.$rtti.$Set("TSysCharSet",{comptype: rtl.char});
  rtl.recNewT(this,"TFloatRec",function () {
    this.Exponent = 0;
    this.Negative = false;
    this.$new = function () {
      var r = Object.create(this);
      r.Digits = rtl.arraySetLength(null,"\x00",19);
      return r;
    };
    this.$eq = function (b) {
      return (this.Exponent === b.Exponent) && (this.Negative === b.Negative) && rtl.arrayEq(this.Digits,b.Digits);
    };
    this.$assign = function (s) {
      this.Exponent = s.Exponent;
      this.Negative = s.Negative;
      this.Digits = s.Digits.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("TFloatRec",{},this);
    $r.addField("Exponent",rtl.longint);
    $r.addField("Negative",rtl.boolean);
    $mod.$rtti.$StaticArray("TFloatRec.Digits$a",{dims: [19], eltype: rtl.char});
    $r.addField("Digits",$mod.$rtti["TFloatRec.Digits$a"]);
  });
  this.TEndian = {"0": "Little", Little: 0, "1": "Big", Big: 1};
  this.$rtti.$Enum("TEndian",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TEndian});
  this.$rtti.$StaticArray("TByteArray",{dims: [32768], eltype: rtl.byte});
  this.$rtti.$StaticArray("TWordArray",{dims: [16384], eltype: rtl.word});
  this.$rtti.$DynArray("TBytes",{eltype: rtl.byte});
  this.$rtti.$DynArray("TStringArray",{eltype: rtl.string});
  this.$rtti.$StaticArray("TMonthNameArray",{dims: [12], eltype: rtl.string});
  this.$rtti.$StaticArray("TDayTable",{dims: [12], eltype: rtl.word});
  this.$rtti.$StaticArray("TWeekNameArray",{dims: [7], eltype: rtl.string});
  this.$rtti.$StaticArray("TDayNames",{dims: [7], eltype: rtl.string});
  rtl.recNewT(this,"TFormatSettings",function () {
    this.CurrencyDecimals = 0;
    this.CurrencyFormat = 0;
    this.CurrencyString = "";
    this.DateSeparator = "\x00";
    this.DecimalSeparator = "";
    this.LongDateFormat = "";
    this.LongTimeFormat = "";
    this.NegCurrFormat = 0;
    this.ShortDateFormat = "";
    this.ShortTimeFormat = "";
    this.ThousandSeparator = "";
    this.TimeAMString = "";
    this.TimePMString = "";
    this.TimeSeparator = "\x00";
    this.ListSeparator = "\x00";
    this.TwoDigitYearCenturyWindow = 0;
    $mod.$rtti.$ProcVar("TFormatSettings.TLocaleInitCallback",{procsig: rtl.newTIProcSig([["aLocale",rtl.string,2],["aInstance",$r]])});
    this.InitLocaleHandler = null;
    this.$new = function () {
      var r = Object.create(this);
      r.DateTimeToStrFormat = rtl.arraySetLength(null,"",2);
      r.LongDayNames = rtl.arraySetLength(null,"",7);
      r.LongMonthNames = rtl.arraySetLength(null,"",12);
      r.ShortDayNames = rtl.arraySetLength(null,"",7);
      r.ShortMonthNames = rtl.arraySetLength(null,"",12);
      return r;
    };
    this.$eq = function (b) {
      return (this.CurrencyDecimals === b.CurrencyDecimals) && (this.CurrencyFormat === b.CurrencyFormat) && (this.CurrencyString === b.CurrencyString) && (this.DateSeparator === b.DateSeparator) && rtl.arrayEq(this.DateTimeToStrFormat,b.DateTimeToStrFormat) && (this.DecimalSeparator === b.DecimalSeparator) && (this.LongDateFormat === b.LongDateFormat) && rtl.arrayEq(this.LongDayNames,b.LongDayNames) && rtl.arrayEq(this.LongMonthNames,b.LongMonthNames) && (this.LongTimeFormat === b.LongTimeFormat) && (this.NegCurrFormat === b.NegCurrFormat) && (this.ShortDateFormat === b.ShortDateFormat) && rtl.arrayEq(this.ShortDayNames,b.ShortDayNames) && rtl.arrayEq(this.ShortMonthNames,b.ShortMonthNames) && (this.ShortTimeFormat === b.ShortTimeFormat) && (this.ThousandSeparator === b.ThousandSeparator) && (this.TimeAMString === b.TimeAMString) && (this.TimePMString === b.TimePMString) && (this.TimeSeparator === b.TimeSeparator) && (this.ListSeparator === b.ListSeparator) && (this.TwoDigitYearCenturyWindow === b.TwoDigitYearCenturyWindow);
    };
    this.$assign = function (s) {
      this.CurrencyDecimals = s.CurrencyDecimals;
      this.CurrencyFormat = s.CurrencyFormat;
      this.CurrencyString = s.CurrencyString;
      this.DateSeparator = s.DateSeparator;
      this.DateTimeToStrFormat = s.DateTimeToStrFormat.slice(0);
      this.DecimalSeparator = s.DecimalSeparator;
      this.LongDateFormat = s.LongDateFormat;
      this.LongDayNames = s.LongDayNames.slice(0);
      this.LongMonthNames = s.LongMonthNames.slice(0);
      this.LongTimeFormat = s.LongTimeFormat;
      this.NegCurrFormat = s.NegCurrFormat;
      this.ShortDateFormat = s.ShortDateFormat;
      this.ShortDayNames = s.ShortDayNames.slice(0);
      this.ShortMonthNames = s.ShortMonthNames.slice(0);
      this.ShortTimeFormat = s.ShortTimeFormat;
      this.ThousandSeparator = s.ThousandSeparator;
      this.TimeAMString = s.TimeAMString;
      this.TimePMString = s.TimePMString;
      this.TimeSeparator = s.TimeSeparator;
      this.ListSeparator = s.ListSeparator;
      this.TwoDigitYearCenturyWindow = s.TwoDigitYearCenturyWindow;
      return this;
    };
    this.GetJSLocale = function () {
      return Intl.DateTimeFormat().resolvedOptions().locale;
    };
    this.GetLocaleShortDayName = function (ADayOfWeek, ALocale) {
      var Result = "";
      var d = null;
      d = new Date(2017,0,1,0,0,0,0);
      d.setDate((d.getDate() + ADayOfWeek) - 1);
      Result = d.toLocaleDateString(ALocale,pas.JS.New(["weekday","short"]));
      return Result;
    };
    this.GetLocaleDecimalSeparator = function (ALocale) {
      var lNumber = 1.1;
      lNumber = lNumber.toLocaleString(ALocale).substring(1, 2);
      return lNumber;
    };
    this.GetLocaleLongMonthName = function (AMonth, ALocale) {
      var lBaseDate = new Date(2017, AMonth - 1, 1);
      return lBaseDate.toLocaleDateString(ALocale, { month: 'long' });
    };
    this.GetLocaleLongDayName = function (ADayOfWeek, ALocale) {
      var lBaseDate = new Date(2017, 0, 1); // Sunday
      lBaseDate.setDate(lBaseDate.getDate() + ADayOfWeek - 1);
      return lBaseDate.toLocaleDateString(ALocale, { weekday: 'long' });
    };
    this.GetLocaleShortMonthName = function (AMonth, ALocale) {
      var Result = "";
      var d = null;
      d = new Date(2017,AMonth - 1,1,0,0,0,0);
      Result = d.toLocaleDateString(ALocale,pas.JS.New(["month","short"]));
      return Result;
    };
    this.Create = function () {
      var Result = $mod.TFormatSettings.$new();
      Result.$assign($mod.TFormatSettings.Create$1($mod.TFormatSettings.GetJSLocale()));
      return Result;
    };
    this.Create$1 = function (ALocale) {
      var Result = $mod.TFormatSettings.$new();
      Result.LongDayNames = $impl.DefaultLongDayNames.slice(0);
      Result.ShortDayNames = $impl.DefaultShortDayNames.slice(0);
      Result.ShortMonthNames = $impl.DefaultShortMonthNames.slice(0);
      Result.LongMonthNames = $impl.DefaultLongMonthNames.slice(0);
      Result.DateTimeToStrFormat[0] = "c";
      Result.DateTimeToStrFormat[1] = "f";
      Result.DateSeparator = "-";
      Result.TimeSeparator = ":";
      Result.ShortDateFormat = "yyyy-mm-dd";
      Result.LongDateFormat = "ddd, yyyy-mm-dd";
      Result.ShortTimeFormat = "hh:nn";
      Result.LongTimeFormat = "hh:nn:ss";
      Result.DecimalSeparator = ".";
      Result.ThousandSeparator = ",";
      Result.TimeAMString = "AM";
      Result.TimePMString = "PM";
      Result.TwoDigitYearCenturyWindow = 50;
      Result.CurrencyFormat = 0;
      Result.NegCurrFormat = 0;
      Result.CurrencyDecimals = 2;
      Result.CurrencyString = "$";
      if ($mod.TFormatSettings.InitLocaleHandler != null) $mod.TFormatSettings.InitLocaleHandler($mod.UpperCase(ALocale),$mod.TFormatSettings.$clone(Result));
      return Result;
    };
    this.Invariant = function () {
      var Result = $mod.TFormatSettings.$new();
      Result.CurrencyString = "¤";
      Result.CurrencyFormat = 0;
      Result.CurrencyDecimals = 2;
      Result.DateSeparator = "/";
      Result.TimeSeparator = ":";
      Result.ShortDateFormat = "MM/dd/yyyy";
      Result.LongDateFormat = "dddd, dd MMMMM yyyy HH:mm:ss";
      Result.TimeAMString = "AM";
      Result.TimePMString = "PM";
      Result.ShortTimeFormat = "HH:mm";
      Result.LongTimeFormat = "HH:mm:ss";
      Result.ShortMonthNames = $impl.DefaultShortMonthNames.slice(0);
      Result.ShortMonthNames = $impl.DefaultShortMonthNames.slice(0);
      Result.LongMonthNames = $impl.DefaultLongMonthNames.slice(0);
      Result.ShortDayNames = $impl.DefaultShortDayNames.slice(0);
      Result.LongDayNames = $impl.DefaultLongDayNames.slice(0);
      Result.ThousandSeparator = ",";
      Result.DecimalSeparator = ".";
      Result.TwoDigitYearCenturyWindow = 50;
      Result.NegCurrFormat = 0;
      return Result;
    };
    var $r = $mod.$rtti.$Record("TFormatSettings",{},this);
    $r.addField("CurrencyDecimals",rtl.byte);
    $r.addField("CurrencyFormat",rtl.byte);
    $r.addField("CurrencyString",rtl.string);
    $r.addField("DateSeparator",rtl.char);
    $mod.$rtti.$StaticArray("TFormatSettings.DateTimeToStrFormat$a",{dims: [2], eltype: rtl.string});
    $r.addField("DateTimeToStrFormat",$mod.$rtti["TFormatSettings.DateTimeToStrFormat$a"]);
    $r.addField("DecimalSeparator",rtl.string);
    $r.addField("LongDateFormat",rtl.string);
    $r.addField("LongDayNames",$mod.$rtti["TDayNames"]);
    $r.addField("LongMonthNames",$mod.$rtti["TMonthNameArray"]);
    $r.addField("LongTimeFormat",rtl.string);
    $r.addField("NegCurrFormat",rtl.byte);
    $r.addField("ShortDateFormat",rtl.string);
    $r.addField("ShortDayNames",$mod.$rtti["TDayNames"]);
    $r.addField("ShortMonthNames",$mod.$rtti["TMonthNameArray"]);
    $r.addField("ShortTimeFormat",rtl.string);
    $r.addField("ThousandSeparator",rtl.string);
    $r.addField("TimeAMString",rtl.string);
    $r.addField("TimePMString",rtl.string);
    $r.addField("TimeSeparator",rtl.char);
    $r.addField("ListSeparator",rtl.char);
    $r.addField("TwoDigitYearCenturyWindow",rtl.word);
    $r.addField("InitLocaleHandler",$mod.$rtti["TFormatSettings.TLocaleInitCallback"]);
    $r.addMethod("Create",5,[],2,$r,1);
    $r.addMethod("Create$1",5,[["ALocale",rtl.string,2]],2,$r,1);
    $r.addMethod("Invariant",5,[],2,$r,1);
  },true);
  rtl.createClass(this,"Exception",pas.System.TObject,function () {
    this.LogMessageOnCreate = false;
    this.$init = function () {
      pas.System.TObject.$init.call(this);
      this.fMessage = "";
      this.fHelpContext = 0;
      this.FJSError = null;
    };
    this.$final = function () {
      this.FJSError = undefined;
      pas.System.TObject.$final.call(this);
    };
    this.Create$1 = function (Msg) {
      this.fMessage = Msg;
      this.FJSError = new Error();
      if (this.LogMessageOnCreate) pas.System.Writeln("Created exception ",this.$classname," with message: ",Msg);
      return this;
    };
    this.CreateFmt = function (Msg, Args) {
      this.Create$1($mod.Format(Msg,Args));
      return this;
    };
    this.CreateHelp = function (Msg, AHelpContext) {
      this.Create$1(Msg);
      this.fHelpContext = AHelpContext;
      return this;
    };
    this.CreateFmtHelp = function (Msg, Args, AHelpContext) {
      this.Create$1($mod.Format(Msg,Args));
      this.fHelpContext = AHelpContext;
      return this;
    };
    this.ToString = function () {
      var Result = "";
      Result = this.$classname + ": " + this.fMessage;
      return Result;
    };
  });
  this.$rtti.$ClassRef("ExceptClass",{instancetype: this.$rtti["Exception"]});
  rtl.createClass(this,"EExternal",this.Exception,function () {
  });
  rtl.createClass(this,"EMathError",this.EExternal,function () {
  });
  rtl.createClass(this,"EInvalidOp",this.EMathError,function () {
  });
  rtl.createClass(this,"EZeroDivide",this.EMathError,function () {
  });
  rtl.createClass(this,"EOverflow",this.EMathError,function () {
  });
  rtl.createClass(this,"EUnderflow",this.EMathError,function () {
  });
  rtl.createClass(this,"EAbort",this.Exception,function () {
  });
  rtl.createClass(this,"EInvalidCast",this.Exception,function () {
  });
  rtl.createClass(this,"EAssertionFailed",this.Exception,function () {
  });
  rtl.createClass(this,"EObjectCheck",this.Exception,function () {
  });
  rtl.createClass(this,"EConvertError",this.Exception,function () {
  });
  rtl.createClass(this,"EFormatError",this.Exception,function () {
  });
  rtl.createClass(this,"EIntError",this.EExternal,function () {
  });
  rtl.createClass(this,"EDivByZero",this.EIntError,function () {
  });
  rtl.createClass(this,"ERangeError",this.EIntError,function () {
  });
  rtl.createClass(this,"EIntOverflow",this.EIntError,function () {
  });
  rtl.createClass(this,"EInOutError",this.Exception,function () {
    this.$init = function () {
      $mod.Exception.$init.call(this);
      this.ErrorCode = 0;
    };
  });
  rtl.createClass(this,"EHeapMemoryError",this.Exception,function () {
  });
  rtl.createClass(this,"EExternalException",this.EExternal,function () {
  });
  rtl.createClass(this,"EJSException",this.EExternalException,function () {
    this.create$2 = function (aJSError) {
      $mod.Exception.CreateFmt.call(this,"Javascript %s exception : %s",pas.System.VarRecs(18,pas.JS.JSClassName(aJSError),18,aJSError.message));
      return this;
    };
  });
  rtl.createClass(this,"EInvalidPointer",this.EHeapMemoryError,function () {
  });
  rtl.createClass(this,"EOutOfMemory",this.EHeapMemoryError,function () {
  });
  rtl.createClass(this,"EVariantError",this.Exception,function () {
    this.$init = function () {
      $mod.Exception.$init.call(this);
      this.ErrCode = 0;
    };
    this.CreateCode = function (Code) {
      this.ErrCode = Code;
      return this;
    };
  });
  rtl.createClass(this,"EAccessViolation",this.EExternal,function () {
  });
  rtl.createClass(this,"EBusError",this.EAccessViolation,function () {
  });
  rtl.createClass(this,"EPrivilege",this.EExternal,function () {
  });
  rtl.createClass(this,"EStackOverflow",this.EExternal,function () {
  });
  rtl.createClass(this,"EControlC",this.EExternal,function () {
  });
  rtl.createClass(this,"EAbstractError",this.Exception,function () {
  });
  rtl.createClass(this,"EPropReadOnly",this.Exception,function () {
  });
  rtl.createClass(this,"EPropWriteOnly",this.Exception,function () {
  });
  rtl.createClass(this,"EIntfCastError",this.Exception,function () {
  });
  rtl.createClass(this,"EInvalidContainer",this.Exception,function () {
  });
  rtl.createClass(this,"EInvalidInsert",this.Exception,function () {
  });
  rtl.createClass(this,"EPackageError",this.Exception,function () {
  });
  rtl.createClass(this,"EOSError",this.Exception,function () {
    this.$init = function () {
      $mod.Exception.$init.call(this);
      this.ErrorCode = 0;
    };
  });
  rtl.createClass(this,"ESafecallException",this.Exception,function () {
  });
  rtl.createClass(this,"ENoThreadSupport",this.Exception,function () {
  });
  rtl.createClass(this,"ENoWideStringSupport",this.Exception,function () {
  });
  rtl.createClass(this,"ENotImplemented",this.Exception,function () {
  });
  rtl.createClass(this,"EArgumentException",this.Exception,function () {
  });
  rtl.createClass(this,"EArgumentOutOfRangeException",this.EArgumentException,function () {
  });
  rtl.createClass(this,"EArgumentNilException",this.EArgumentException,function () {
  });
  rtl.createClass(this,"EPathTooLongException",this.Exception,function () {
  });
  rtl.createClass(this,"ENotSupportedException",this.Exception,function () {
  });
  rtl.createClass(this,"EDirectoryNotFoundException",this.Exception,function () {
  });
  rtl.createClass(this,"EFileNotFoundException",this.Exception,function () {
  });
  rtl.createClass(this,"EPathNotFoundException",this.Exception,function () {
  });
  rtl.createClass(this,"ENoConstructException",this.Exception,function () {
  });
  this.EmptyStr = "";
  this.EmptyWideStr = "";
  this.HexDisplayPrefix = "$";
  this.LeadBytes = {};
  this.CharInSet = function (Ch, CSet) {
    var Result = false;
    var I = 0;
    Result = false;
    I = rtl.length(CSet) - 1;
    while (!Result && (I >= 0)) {
      Result = Ch === CSet[I];
      I -= 1;
    };
    return Result;
  };
  this.LeftStr = function (S, Count) {
    return (Count>0) ? S.substr(0,Count) : "";
  };
  this.RightStr = function (S, Count) {
    var l = S.length;
    return (Count<1) ? "" : ( Count>=l ? S : S.substr(l-Count));
  };
  this.Trim = function (S) {
    return S.replace(/^[\s\uFEFF\xA0\x00-\x1f]+/,'').replace(/[\s\uFEFF\xA0\x00-\x1f]+$/,'');
  };
  this.TrimLeft = function (S) {
    return S.replace(/^[\s\uFEFF\xA0\x00-\x1f]+/,'');
  };
  this.TrimRight = function (S) {
    return S.replace(/[\s\uFEFF\xA0\x00-\x1f]+$/,'');
  };
  this.UpperCase = function (s) {
    return s.toUpperCase();
  };
  this.LowerCase = function (s) {
    return s.toLowerCase();
  };
  this.CompareStr = function (s1, s2) {
    var l1 = s1.length;
    var l2 = s2.length;
    if (l1<=l2){
      var s = s2.substr(0,l1);
      if (s1<s){ return -1;
      } else if (s1>s){ return 1;
      } else { return l1<l2 ? -1 : 0; };
    } else {
      var s = s1.substr(0,l2);
      if (s<s2){ return -1;
      } else { return 1; };
    };
  };
  this.SameStr = function (s1, s2) {
    return s1 == s2;
  };
  this.CompareText = function (s1, s2) {
    var l1 = s1.toLowerCase();
    var l2 = s2.toLowerCase();
    if (l1>l2){ return 1;
    } else if (l1<l2){ return -1;
    } else { return 0; };
  };
  this.SameText = function (s1, s2) {
    return s1.toLowerCase() == s2.toLowerCase();
  };
  this.AnsiCompareText = function (s1, s2) {
    return s1.localeCompare(s2);
  };
  this.AnsiSameText = function (s1, s2) {
    return s1.toLowerCase() == s2.toLowerCase();
  };
  this.AnsiCompareStr = function (s1, s2) {
    var Result = 0;
    Result = $mod.CompareText(s1,s2);
    return Result;
  };
  this.AppendStr = function (Dest, S) {
    Dest.set(Dest.get() + S);
  };
  this.Format = function (Fmt, Args) {
    var Result = "";
    Result = $mod.Format$1(Fmt,Args,$mod.FormatSettings);
    return Result;
  };
  this.Format$1 = function (Fmt, Args, aSettings) {
    var Result = "";
    var ChPos = 0;
    var OldPos = 0;
    var ArgPos = 0;
    var DoArg = 0;
    var Len = 0;
    var Hs = "";
    var ToAdd = "";
    var Index = 0;
    var Width = 0;
    var Prec = 0;
    var Left = false;
    var Fchar = "\x00";
    var vq = 0;
    function ReadFormat() {
      var Result = "\x00";
      var Value = 0;
      function ReadInteger() {
        var Code = 0;
        var ArgN = 0;
        if (Value !== -1) return;
        OldPos = ChPos;
        while ((ChPos <= Len) && (Fmt.charAt(ChPos - 1) <= "9") && (Fmt.charAt(ChPos - 1) >= "0")) ChPos += 1;
        if (ChPos > Len) $impl.DoFormatError(1,Fmt);
        if (Fmt.charAt(ChPos - 1) === "*") {
          if (Index === 255) {
            ArgN = ArgPos}
           else {
            ArgN = Index;
            Index += 1;
          };
          if ((ChPos > OldPos) || (ArgN > (rtl.length(Args) - 1))) $impl.DoFormatError(1,Fmt);
          ArgPos = ArgN + 1;
          var $tmp = Args[ArgN].VType;
          if ($tmp === 0) {
            Value = Args[ArgN].VJSValue}
           else if ($tmp === 19) {
            Value = Args[ArgN].VJSValue}
           else {
            $impl.DoFormatError(1,Fmt);
          };
          ChPos += 1;
        } else {
          if (OldPos < ChPos) {
            pas.System.val(pas.System.Copy(Fmt,OldPos,ChPos - OldPos),{get: function () {
                return Value;
              }, set: function (v) {
                Value = v;
              }},{get: function () {
                return Code;
              }, set: function (v) {
                Code = v;
              }});
            if (Code > 0) $impl.DoFormatError(1,Fmt);
          } else Value = -1;
        };
      };
      function ReadIndex() {
        if (Fmt.charAt(ChPos - 1) !== ":") {
          ReadInteger()}
         else Value = 0;
        if (Fmt.charAt(ChPos - 1) === ":") {
          if (Value === -1) $impl.DoFormatError(2,Fmt);
          Index = Value;
          Value = -1;
          ChPos += 1;
        };
      };
      function ReadLeft() {
        if (Fmt.charAt(ChPos - 1) === "-") {
          Left = true;
          ChPos += 1;
        } else Left = false;
      };
      function ReadWidth() {
        ReadInteger();
        if (Value !== -1) {
          Width = Value;
          Value = -1;
        };
      };
      function ReadPrec() {
        if (Fmt.charAt(ChPos - 1) === ".") {
          ChPos += 1;
          ReadInteger();
          if (Value === -1) Value = 0;
          Prec = Value;
        };
      };
      Index = 255;
      Width = -1;
      Prec = -1;
      Value = -1;
      ChPos += 1;
      if (Fmt.charAt(ChPos - 1) === "%") {
        Result = "%";
        return Result;
      };
      ReadIndex();
      ReadLeft();
      ReadWidth();
      ReadPrec();
      Result = pas.System.upcase(Fmt.charAt(ChPos - 1));
      return Result;
    };
    function Checkarg(AT, err) {
      var Result = false;
      Result = false;
      if (Index === 255) {
        DoArg = ArgPos}
       else DoArg = Index;
      ArgPos = DoArg + 1;
      if ((DoArg > (rtl.length(Args) - 1)) || (Args[DoArg].VType !== AT)) {
        if (err) $impl.DoFormatError(3,Fmt);
        ArgPos -= 1;
        return Result;
      };
      Result = true;
      return Result;
    };
    Result = "";
    Len = Fmt.length;
    ChPos = 1;
    OldPos = 1;
    ArgPos = 0;
    while (ChPos <= Len) {
      while ((ChPos <= Len) && (Fmt.charAt(ChPos - 1) !== "%")) ChPos += 1;
      if (ChPos > OldPos) Result = Result + pas.System.Copy(Fmt,OldPos,ChPos - OldPos);
      if (ChPos < Len) {
        Fchar = ReadFormat();
        var $tmp = Fchar;
        if ($tmp === "D") {
          if (Checkarg(0,false)) {
            ToAdd = $mod.IntToStr(Args[DoArg].VJSValue)}
           else if (Checkarg(19,true)) ToAdd = $mod.IntToStr(Args[DoArg].VJSValue);
          Width = Math.abs(Width);
          Index = Prec - ToAdd.length;
          if (ToAdd.charAt(0) !== "-") {
            ToAdd = pas.System.StringOfChar("0",Index) + ToAdd}
           else pas.System.Insert(pas.System.StringOfChar("0",Index + 1),{get: function () {
              return ToAdd;
            }, set: function (v) {
              ToAdd = v;
            }},2);
        } else if ($tmp === "U") {
          if (Checkarg(0,false)) {
            ToAdd = $mod.IntToStr(Args[DoArg].VJSValue >>> 0)}
           else if (Checkarg(19,true)) ToAdd = $mod.IntToStr(Args[DoArg].VJSValue);
          Width = Math.abs(Width);
          Index = Prec - ToAdd.length;
          ToAdd = pas.System.StringOfChar("0",Index) + ToAdd;
        } else if ($tmp === "E") {
          if (Checkarg(12,false)) {
            ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue / 10000,$mod.TFloatFormat.ffExponent,3,Prec,aSettings)}
           else if (Checkarg(3,true)) ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue,$mod.TFloatFormat.ffExponent,3,Prec,aSettings);
        } else if ($tmp === "F") {
          if (Checkarg(12,false)) {
            ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue / 10000,$mod.TFloatFormat.ffFixed,9999,Prec,aSettings)}
           else if (Checkarg(3,true)) ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue,$mod.TFloatFormat.ffFixed,9999,Prec,aSettings);
        } else if ($tmp === "G") {
          if (Checkarg(12,false)) {
            ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue / 10000,$mod.TFloatFormat.ffGeneral,Prec,3,aSettings)}
           else if (Checkarg(3,true)) ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue,$mod.TFloatFormat.ffGeneral,Prec,3,aSettings);
        } else if ($tmp === "N") {
          if (Checkarg(12,false)) {
            ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue / 10000,$mod.TFloatFormat.ffNumber,9999,Prec,aSettings)}
           else if (Checkarg(3,true)) ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue,$mod.TFloatFormat.ffNumber,9999,Prec,aSettings);
        } else if ($tmp === "M") {
          if (Checkarg(12,false)) {
            ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue / 10000,$mod.TFloatFormat.ffCurrency,9999,Prec,aSettings)}
           else if (Checkarg(3,true)) ToAdd = $mod.FloatToStrF$1(Args[DoArg].VJSValue,$mod.TFloatFormat.ffCurrency,9999,Prec,aSettings);
        } else if ($tmp === "S") {
          if (Checkarg(18,false)) {
            Hs = Args[DoArg].VJSValue}
           else if (Checkarg(9,true)) Hs = Args[DoArg].VJSValue;
          Index = Hs.length;
          if ((Prec !== -1) && (Index > Prec)) Index = Prec;
          ToAdd = pas.System.Copy(Hs,1,Index);
        } else if ($tmp === "P") {
          if (Checkarg(0,false)) {
            ToAdd = $mod.IntToHex(Args[DoArg].VJSValue,8)}
           else if (Checkarg(0,true)) ToAdd = $mod.IntToHex(Args[DoArg].VJSValue,16);
        } else if ($tmp === "X") {
          if (Checkarg(0,false)) {
            vq = Args[DoArg].VJSValue;
            Index = 16;
          } else if (Checkarg(19,true)) {
            vq = Args[DoArg].VJSValue;
            Index = 31;
          };
          if (Prec > Index) {
            ToAdd = $mod.IntToHex(vq,Index)}
           else {
            Index = 1;
            while ((rtl.shl(1,Index * 4) <= vq) && (Index < 16)) Index += 1;
            if (Index > Prec) Prec = Index;
            ToAdd = $mod.IntToHex(vq,Prec);
          };
        } else if ($tmp === "%") ToAdd = "%";
        if (Width !== -1) if (ToAdd.length < Width) if (!Left) {
          ToAdd = pas.System.StringOfChar(" ",Width - ToAdd.length) + ToAdd}
         else ToAdd = ToAdd + pas.System.StringOfChar(" ",Width - ToAdd.length);
        Result = Result + ToAdd;
      };
      ChPos += 1;
      OldPos = ChPos;
    };
    return Result;
  };
  this.BytesOf = function (AVal) {
    var Result = [];
    var I = 0;
    Result = rtl.arraySetLength(Result,0,AVal.length);
    for (var $l = 0, $end = AVal.length - 1; $l <= $end; $l++) {
      I = $l;
      Result[I] = AVal.charCodeAt((I + 1) - 1);
    };
    return Result;
  };
  this.StringOf = function (ABytes) {
    var Result = "";
    var I = 0;
    Result = "";
    for (var $l = 0, $end = rtl.length(ABytes) - 1; $l <= $end; $l++) {
      I = $l;
      Result = Result + String.fromCharCode(ABytes[I]);
    };
    return Result;
  };
  this.LocaleCompare = function (s1, s2, locales) {
    return s1.localeCompare(s2,locales) == 0;
  };
  this.NormalizeStr = function (S, Norm) {
    return S.normalize(Norm);
  };
  var Alpha = rtl.createSet(null,65,90,null,97,122,95);
  var AlphaNum = rtl.unionSet(Alpha,rtl.createSet(null,48,57));
  var Dot = ".";
  this.IsValidIdent = function (Ident, AllowDots, StrictDots) {
    var Result = false;
    var First = false;
    var I = 0;
    var Len = 0;
    Len = Ident.length;
    if (Len < 1) return false;
    First = true;
    Result = false;
    I = 1;
    while (I <= Len) {
      if (First) {
        if (!(Ident.charCodeAt(I - 1) in Alpha)) return Result;
        First = false;
      } else if (AllowDots && (Ident.charAt(I - 1) === Dot)) {
        if (StrictDots) {
          if (I >= Len) return Result;
          First = true;
        };
      } else if (!(Ident.charCodeAt(I - 1) in AlphaNum)) return Result;
      I = I + 1;
    };
    Result = true;
    return Result;
  };
  this.TStringReplaceFlag = {"0": "rfReplaceAll", rfReplaceAll: 0, "1": "rfIgnoreCase", rfIgnoreCase: 1};
  this.$rtti.$Enum("TStringReplaceFlag",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TStringReplaceFlag});
  this.$rtti.$Set("TStringReplaceFlags",{comptype: this.$rtti["TStringReplaceFlag"]});
  this.StringReplace = function (aOriginal, aSearch, aReplace, Flags) {
    var Result = "";
    var REFlags = "";
    var REString = "";
    REFlags = "";
    if ($mod.TStringReplaceFlag.rfReplaceAll in Flags) REFlags = "g";
    if ($mod.TStringReplaceFlag.rfIgnoreCase in Flags) REFlags = REFlags + "i";
    REString = aSearch.replace(new RegExp($impl.RESpecials,"g"),"\\$1");
    Result = aOriginal.replace(new RegExp(REString,REFlags),aReplace);
    return Result;
  };
  this.QuoteString = function (aOriginal, AQuote) {
    var Result = "";
    Result = AQuote + $mod.StringReplace(aOriginal,AQuote,AQuote + AQuote,rtl.createSet($mod.TStringReplaceFlag.rfReplaceAll)) + AQuote;
    return Result;
  };
  this.QuotedStr = function (s, QuoteChar) {
    var Result = "";
    Result = $mod.QuoteString(s,QuoteChar);
    return Result;
  };
  this.DeQuoteString = function (aQuoted, AQuote) {
    var Result = "";
    var i = 0;
    Result = aQuoted;
    if (Result.substring(0,1) !== AQuote) return Result;
    Result = Result.slice(1);
    i = 1;
    while (i <= Result.length) {
      if (Result.charAt(i - 1) === AQuote) {
        if ((i === Result.length) || (Result.charAt((i + 1) - 1) !== AQuote)) {
          Result = Result.slice(0,i - 1);
          return Result;
        } else Result = Result.slice(0,i - 1) + Result.slice(i);
      } else i += 1;
    };
    return Result;
  };
  this.LastDelimiter = function (Delimiters, S) {
    var Result = 0;
    Result = S.length;
    while ((Result > 0) && (pas.System.Pos(S.charAt(Result - 1),Delimiters) === 0)) Result -= 1;
    return Result;
  };
  this.IsDelimiter = function (Delimiters, S, Index) {
    var Result = false;
    Result = false;
    if ((Index > 0) && (Index <= S.length)) Result = pas.System.Pos(S.charAt(Index - 1),Delimiters) !== 0;
    return Result;
  };
  this.AdjustLineBreaks = function (S) {
    var Result = "";
    Result = $mod.AdjustLineBreaks$1(S,pas.System.DefaultTextLineBreakStyle);
    return Result;
  };
  this.AdjustLineBreaks$1 = function (S, Style) {
    var Result = "";
    var I = 0;
    var L = 0;
    var Res = "";
    function Add(C) {
      Res = Res + C;
    };
    I = 0;
    L = S.length;
    Result = "";
    while (I <= L) {
      var $tmp = S.charAt(I - 1);
      if ($tmp === "\n") {
        if (Style in rtl.createSet(pas.System.TTextLineBreakStyle.tlbsCRLF,pas.System.TTextLineBreakStyle.tlbsCR)) Add("\r");
        if (Style === pas.System.TTextLineBreakStyle.tlbsCRLF) Add("\n");
        I += 1;
      } else if ($tmp === "\r") {
        if (Style === pas.System.TTextLineBreakStyle.tlbsCRLF) Add("\r");
        Add("\n");
        I += 1;
        if (S.charAt(I - 1) === "\n") I += 1;
      } else {
        Add(S.charAt(I - 1));
        I += 1;
      };
    };
    Result = Res;
    return Result;
  };
  var Quotes = rtl.createSet(39,34);
  this.WrapText = function (Line, BreakStr, BreakChars, MaxCol) {
    var Result = "";
    var L = "";
    var C = "\x00";
    var LQ = "\x00";
    var BC = "\x00";
    var P = 0;
    var BLen = 0;
    var Len = 0;
    var HB = false;
    var IBC = false;
    Result = "";
    L = Line;
    BLen = BreakStr.length;
    if (BLen > 0) {
      BC = BreakStr.charAt(0)}
     else BC = "\x00";
    Len = L.length;
    while (Len > 0) {
      P = 1;
      LQ = "\x00";
      HB = false;
      IBC = false;
      while ((P <= Len) && ((P <= MaxCol) || !IBC) && ((LQ !== "\x00") || !HB)) {
        C = L.charAt(P - 1);
        if (C === LQ) {
          LQ = "\x00"}
         else if (C.charCodeAt() in Quotes) LQ = C;
        if (LQ !== "\x00") {
          P += 1}
         else {
          HB = (C === BC) && (BreakStr === pas.System.Copy(L,P,BLen));
          if (HB) {
            P += BLen}
           else {
            if (P >= MaxCol) IBC = $mod.CharInSet(C,BreakChars);
            P += 1;
          };
        };
      };
      Result = Result + pas.System.Copy(L,1,P - 1);
      pas.System.Delete({get: function () {
          return L;
        }, set: function (v) {
          L = v;
        }},1,P - 1);
      Len = L.length;
      if ((Len > 0) && !HB) Result = Result + BreakStr;
    };
    return Result;
  };
  this.WrapText$1 = function (Line, MaxCol) {
    var Result = "";
    Result = $mod.WrapText(Line,pas.System.sLineBreak,[" ","-","\t"],MaxCol);
    return Result;
  };
  this.SwapEndian = function (W) {
    var Result = 0;
    Result = ((W & 0xFF) << 8) | ((W >>> 8) & 0xFF);
    return Result;
  };
  this.SwapEndian$1 = function (C) {
    var Result = 0;
    Result = rtl.lw(rtl.lw(rtl.lw(rtl.lw((C & 0xFF) << 24) | rtl.lw((C & 0xFF00) << 8)) | (rtl.lw(C >>> 8) & 0xFF00)) | (rtl.lw(C >>> 24) & 0xFF));
    return Result;
  };
  this.IntToStr = function (Value) {
    var Result = "";
    Result = "" + Value;
    return Result;
  };
  this.TryStrToInt = function (S, res) {
    var Result = false;
    var NI = 0;
    Result = $mod.TryStrToInt$2(S,{get: function () {
        return NI;
      }, set: function (v) {
        NI = v;
      }});
    Result = Result && (-2147483648 <= NI) && (NI <= 2147483647);
    if (Result) res.set(NI);
    return Result;
  };
  this.TryStrToInt$1 = function (S, res, aSettings) {
    var Result = false;
    var N = 0;
    Result = $impl.IntTryStrToInt(S,{get: function () {
        return N;
      }, set: function (v) {
        N = v;
      }},aSettings.DecimalSeparator);
    if (Result) if (N <= 2147483647) {
      res.set(N)}
     else Result = false;
    return Result;
  };
  this.TryStrToInt$2 = function (S, res) {
    var Result = false;
    Result = $impl.IntTryStrToInt(S,res,$mod.FormatSettings.DecimalSeparator);
    return Result;
  };
  this.TryStrToInt$3 = function (S, res, aSettings) {
    var Result = false;
    Result = $impl.IntTryStrToInt(S,res,aSettings.DecimalSeparator);
    return Result;
  };
  this.StrToIntDef = function (S, aDef) {
    var Result = 0;
    var R = 0;
    if ($mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }})) {
      Result = R}
     else Result = aDef;
    return Result;
  };
  this.StrToIntDef$1 = function (S, aDef) {
    var Result = 0;
    var R = 0;
    if ($mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }})) {
      Result = R}
     else Result = aDef;
    return Result;
  };
  this.StrToInt = function (S) {
    var Result = 0;
    var R = 0;
    if (!$mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    Result = R;
    return Result;
  };
  this.StrToNativeInt = function (S) {
    var Result = 0;
    if (!$mod.TryStrToInt$2(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.StrToUInt = function (s) {
    var Result = 0;
    if (!$mod.TryStrToUInt(s,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,s)]);
    return Result;
  };
  this.StrToUIntDef = function (s, aDef) {
    var Result = 0;
    if (!$mod.TryStrToUInt(s,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = aDef;
    return Result;
  };
  this.UIntToStr = function (Value) {
    var Result = "";
    Result = $mod.IntToStr(Value);
    return Result;
  };
  this.TryStrToUInt = function (s, C) {
    var Result = false;
    var N = 0;
    Result = $mod.TryStrToInt$2(s,{get: function () {
        return N;
      }, set: function (v) {
        N = v;
      }});
    Result = (N >= 0) && (N <= 4294967295);
    if (Result) C.set(N);
    return Result;
  };
  this.StrToInt64 = function (S) {
    var Result = 0;
    var N = 0;
    if (!$mod.TryStrToInt$2(S,{get: function () {
        return N;
      }, set: function (v) {
        N = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    Result = N;
    return Result;
  };
  this.StrToInt64Def = function (S, ADefault) {
    var Result = 0;
    if (!$mod.TryStrToInt64(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = ADefault;
    return Result;
  };
  this.TryStrToInt64 = function (S, res) {
    var Result = false;
    var R = 0;
    Result = $mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }});
    if (Result) res.set(R);
    return Result;
  };
  this.TryStrToInt64$1 = function (S, res) {
    var Result = false;
    Result = $mod.TryStrToInt64(S,res);
    return Result;
  };
  this.StrToQWord = function (S) {
    var Result = 0;
    var N = 0;
    if (!$mod.TryStrToInt$2(S,{get: function () {
        return N;
      }, set: function (v) {
        N = v;
      }}) || (N < 0)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    Result = N;
    return Result;
  };
  this.StrToQWordDef = function (S, ADefault) {
    var Result = 0;
    if (!$mod.TryStrToQWord(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = ADefault;
    return Result;
  };
  this.TryStrToQWord = function (S, res) {
    var Result = false;
    var R = 0;
    Result = $mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }}) && (R >= 0);
    if (Result) res.set(R);
    return Result;
  };
  this.TryStrToQWord$1 = function (S, res) {
    var Result = false;
    Result = $mod.TryStrToQWord(S,res);
    return Result;
  };
  this.StrToUInt64 = function (S) {
    var Result = 0;
    var N = 0;
    if (!$mod.TryStrToInt$2(S,{get: function () {
        return N;
      }, set: function (v) {
        N = v;
      }}) || (N < 0)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    Result = N;
    return Result;
  };
  this.StrToUInt64Def = function (S, ADefault) {
    var Result = 0;
    if (!$mod.TryStrToUInt64(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = ADefault;
    return Result;
  };
  this.TryStrToUInt64 = function (S, res) {
    var Result = false;
    var R = 0;
    Result = $mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }}) && (R >= 0);
    if (Result) res.set(R);
    return Result;
  };
  this.TryStrToUInt64$1 = function (S, res) {
    var Result = false;
    Result = $mod.TryStrToUInt64(S,res);
    return Result;
  };
  this.StrToDWord = function (S) {
    var Result = 0;
    if (!$mod.TryStrToDWord(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidInteger"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.StrToDWordDef = function (S, ADefault) {
    var Result = 0;
    if (!$mod.TryStrToDWord(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = ADefault;
    return Result;
  };
  this.TryStrToDWord = function (S, res) {
    var Result = false;
    var R = 0;
    Result = $mod.TryStrToInt$2(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }}) && (R >= 0) && (R <= 0xFFFFFFFF);
    if (Result) res.set(R);
    return Result;
  };
  this.IntToHex = function (Value, Digits) {
    var Result = "";
    Result = "";
    if (Value < 0) if (Value<0) Value = 0xFFFFFFFF + Value + 1;
    Result=Value.toString(16);
    Result = $mod.UpperCase(Result);
    while (Result.length < Digits) Result = "0" + Result;
    return Result;
  };
  this.MaxCurrency = 900719925474.0991;
  this.MinCurrency = -900719925474.0991;
  this.TFloatFormat = {"0": "ffFixed", ffFixed: 0, "1": "ffGeneral", ffGeneral: 1, "2": "ffExponent", ffExponent: 2, "3": "ffNumber", ffNumber: 3, "4": "ffCurrency", ffCurrency: 4};
  this.$rtti.$Enum("TFloatFormat",{minvalue: 0, maxvalue: 4, ordtype: 1, enumtype: this.TFloatFormat});
  var Rounds = "123456789:";
  this.FloatToDecimal = function (Value, Precision, Decimals) {
    var Result = $mod.TFloatRec.$new();
    var Buffer = "";
    var InfNan = "";
    var OutPos = 0;
    var error = 0;
    var N = 0;
    var L = 0;
    var C = 0;
    var GotNonZeroBeforeDot = false;
    var BeforeDot = false;
    Result.Negative = false;
    Result.Exponent = 0;
    for (C = 0; C <= 19; C++) Result.Digits[C] = "0";
    if (Value === 0) return Result;
    Buffer = rtl.floatToStr(Value,24);
    N = 1;
    L = Buffer.length;
    while (Buffer.charAt(N - 1) === " ") N += 1;
    Result.Negative = Buffer.charAt(N - 1) === "-";
    if (Result.Negative) {
      N += 1}
     else if (Buffer.charAt(N - 1) === "+") N += 1;
    if (L >= (N + 2)) {
      InfNan = pas.System.Copy(Buffer,N,3);
      if (InfNan === "Inf") {
        Result.Digits[0] = "\x00";
        Result.Exponent = 32767;
        return Result;
      };
      if (InfNan === "Nan") {
        Result.Digits[0] = "\x00";
        Result.Exponent = -32768;
        return Result;
      };
    };
    OutPos = 0;
    Result.Exponent = 0;
    BeforeDot = true;
    GotNonZeroBeforeDot = false;
    while ((L >= N) && (Buffer.charAt(N - 1) !== "E")) {
      if (Buffer.charAt(N - 1) === ".") {
        BeforeDot = false}
       else {
        if (BeforeDot) {
          Result.Exponent += 1;
          Result.Digits[OutPos] = Buffer.charAt(N - 1);
          if (Buffer.charAt(N - 1) !== "0") GotNonZeroBeforeDot = true;
        } else Result.Digits[OutPos] = Buffer.charAt(N - 1);
        OutPos += 1;
      };
      N += 1;
    };
    N += 1;
    if (N <= L) {
      pas.System.val$6(pas.System.Copy(Buffer,N,(L - N) + 1),{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }},{get: function () {
          return error;
        }, set: function (v) {
          error = v;
        }});
      Result.Exponent += C;
    };
    N = OutPos;
    L = 19;
    while (N < L) {
      Result.Digits[N] = "0";
      N += 1;
    };
    if ((Decimals + Result.Exponent) < Precision) {
      N = Decimals + Result.Exponent}
     else N = Precision;
    if (N >= L) N = L - 1;
    if (N === 0) {
      if (Result.Digits[0] >= "5") {
        Result.Digits[0] = "1";
        Result.Digits[1] = "\x00";
        Result.Exponent += 1;
      } else Result.Digits[0] = "\x00";
    } else if (N > 0) {
      if (Result.Digits[N] >= "5") {
        do {
          Result.Digits[N] = "\x00";
          N -= 1;
          Result.Digits[N] = Rounds.charAt(($mod.StrToInt(Result.Digits[N]) + 1) - 1);
        } while (!((N === 0) || (Result.Digits[N] < ":")));
        if (Result.Digits[0] === ":") {
          Result.Digits[0] = "1";
          Result.Exponent += 1;
        };
      } else {
        Result.Digits[N] = "0";
        while ((N > -1) && (Result.Digits[N] === "0")) {
          Result.Digits[N] = "\x00";
          N -= 1;
        };
      };
    } else Result.Digits[0] = "\x00";
    if ((Result.Digits[0] === "\x00") && !GotNonZeroBeforeDot) {
      Result.Exponent = 0;
      Result.Negative = false;
    };
    return Result;
  };
  this.FloatToStr = function (Value) {
    var Result = "";
    Result = $mod.FloatToStr$1(Value,$mod.FormatSettings);
    return Result;
  };
  this.FloatToStr$1 = function (Value, aSettings) {
    var Result = "";
    Result = $mod.FloatToStrF$1(Value,$mod.TFloatFormat.ffGeneral,15,0,aSettings);
    return Result;
  };
  this.FloatToStrF = function (Value, format, Precision, Digits) {
    var Result = "";
    Result = $mod.FloatToStrF$1(Value,format,Precision,Digits,$mod.FormatSettings);
    return Result;
  };
  this.FloatToStrF$1 = function (Value, format, Precision, Digits, aSettings) {
    var Result = "";
    var TS = "";
    var DS = "";
    DS = aSettings.DecimalSeparator;
    TS = aSettings.ThousandSeparator;
    var $tmp = format;
    if ($tmp === $mod.TFloatFormat.ffGeneral) {
      Result = $impl.FormatGeneralFloat(Value,Precision,DS)}
     else if ($tmp === $mod.TFloatFormat.ffExponent) {
      Result = $impl.FormatExponentFloat(Value,Precision,Digits,DS)}
     else if ($tmp === $mod.TFloatFormat.ffFixed) {
      Result = $impl.FormatFixedFloat(Value,Digits,DS)}
     else if ($tmp === $mod.TFloatFormat.ffNumber) {
      Result = $impl.FormatNumberFloat(Value,Digits,DS,TS)}
     else if ($tmp === $mod.TFloatFormat.ffCurrency) Result = $impl.FormatNumberCurrency(Value * 10000,Digits,aSettings);
    if ((format !== $mod.TFloatFormat.ffCurrency) && (Result.length > 1) && (Result.charAt(0) === "-")) $impl.RemoveLeadingNegativeSign({get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},DS,TS);
    return Result;
  };
  this.TryStrToFloat = function (S, res) {
    var Result = false;
    Result = $mod.TryStrToFloat$2(S,res);
    return Result;
  };
  this.TryStrToFloat$1 = function (S, res, aSettings) {
    var Result = false;
    Result = $mod.TryStrToFloat$3(S,res,aSettings);
    return Result;
  };
  this.TryStrToFloat$2 = function (S, res) {
    var Result = false;
    Result = $mod.TryStrToFloat$3(S,res,$mod.FormatSettings);
    return Result;
  };
  var TDecimalPart = {"0": "dpDigit", dpDigit: 0, "1": "dpSignificand", dpSignificand: 1, "2": "dpExp", dpExp: 2};
  this.TryStrToFloat$3 = function (S, res, aSettings) {
    var Result = false;
    var J = undefined;
    var I = 0;
    var aStart = 0;
    var Len = 0;
    var N = "";
    var p = 0;
    Result = false;
    N = S;
    if (aSettings.ThousandSeparator !== "") N = $mod.StringReplace(N,aSettings.ThousandSeparator,"",rtl.createSet($mod.TStringReplaceFlag.rfReplaceAll));
    if (aSettings.DecimalSeparator !== ".") N = $mod.StringReplace(N,aSettings.DecimalSeparator,".",{});
    p = TDecimalPart.dpDigit;
    I = 1;
    aStart = 1;
    Len = N.length;
    while (I <= Len) {
      var $tmp = N.charAt(I - 1);
      if (($tmp === "+") || ($tmp === "-")) {
        var $tmp1 = p;
        if ($tmp1 === TDecimalPart.dpSignificand) {
          return Result}
         else if ($tmp1 === TDecimalPart.dpDigit) {
          if (I > aStart) return Result}
         else if ($tmp1 === TDecimalPart.dpExp) if (I > (aStart + 1)) return Result;
      } else if (($tmp >= "0") && ($tmp <= "9")) {}
      else if ($tmp === ".") {
        if (p !== TDecimalPart.dpDigit) return Result;
        p = TDecimalPart.dpSignificand;
        aStart = I;
      } else if (($tmp === "E") || ($tmp === "e")) {
        if (p === TDecimalPart.dpExp) {
          return Result}
         else {
          p = TDecimalPart.dpExp;
          aStart = I;
        };
      } else {
        return Result;
      };
      I += 1;
    };
    J = parseFloat(N);
    Result = !isNaN(J);
    if (Result) res.set(rtl.getNumber(J));
    return Result;
  };
  this.StrToFloatDef = function (S, aDef) {
    var Result = 0.0;
    if (!$mod.TryStrToFloat$3(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},$mod.FormatSettings)) Result = aDef;
    return Result;
  };
  this.StrToFloatDef$1 = function (S, aDef, aSettings) {
    var Result = 0.0;
    if (!$mod.TryStrToFloat$3(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},aSettings)) Result = aDef;
    return Result;
  };
  this.StrToFloat = function (S) {
    var Result = 0.0;
    Result = $mod.StrToFloat$1(S,$mod.FormatSettings);
    return Result;
  };
  this.StrToFloat$1 = function (S, aSettings) {
    var Result = 0.0;
    if (!$mod.TryStrToFloat$3(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},aSettings)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SErrInvalidFloat"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.FormatFloat = function (Fmt, aValue) {
    var Result = "";
    Result = $mod.FormatFloat$1(Fmt,aValue,$mod.TFormatSettings.$clone($mod.FormatSettings));
    return Result;
  };
  var MaxPrecision = 18;
  this.FormatFloat$1 = function (Fmt, aValue, aSettings) {
    var Result = "";
    var E = 0.0;
    var FV = $mod.TFloatRec.$new();
    var Section = "";
    var SectionLength = 0;
    var ThousandSep = false;
    var IsScientific = false;
    var DecimalPos = 0;
    var FirstDigit = 0;
    var LastDigit = 0;
    var RequestedDigits = 0;
    var ExpSize = 0;
    var Available = 0;
    var Current = 0;
    var PadZeroes = 0;
    var DistToDecimal = 0;
    function InitVars() {
      E = aValue;
      Section = "";
      SectionLength = 0;
      ThousandSep = false;
      IsScientific = false;
      DecimalPos = 0;
      FirstDigit = 2147483647;
      LastDigit = 0;
      RequestedDigits = 0;
      ExpSize = 0;
      Available = -1;
    };
    function ToResult(AChar) {
      Result = Result + AChar;
    };
    function AddToResult(AStr) {
      Result = Result + AStr;
    };
    function WriteDigit(ADigit) {
      if (ADigit === "\x00") return;
      DistToDecimal -= 1;
      if (DistToDecimal === -1) {
        AddToResult(aSettings.DecimalSeparator);
        ToResult(ADigit);
      } else {
        ToResult(ADigit);
        if (ThousandSep && ((DistToDecimal % 3) === 0) && (DistToDecimal > 1)) AddToResult(aSettings.ThousandSeparator);
      };
    };
    function GetDigit() {
      var Result = "\x00";
      Result = "\x00";
      if (Current <= Available) {
        Result = FV.Digits[Current];
        Current += 1;
      } else if (DistToDecimal <= LastDigit) {
        DistToDecimal -= 1}
       else Result = "0";
      return Result;
    };
    function CopyDigit() {
      if (PadZeroes === 0) {
        WriteDigit(GetDigit())}
       else if (PadZeroes < 0) {
        PadZeroes += 1;
        if (DistToDecimal <= FirstDigit) {
          WriteDigit("0")}
         else DistToDecimal -= 1;
      } else {
        while (PadZeroes > 0) {
          WriteDigit(GetDigit());
          PadZeroes -= 1;
        };
        WriteDigit(GetDigit());
      };
    };
    function GetSections(SP) {
      var Result = 0;
      var FL = 0;
      var i = 0;
      var C = "\x00";
      var Q = "\x00";
      var inQuote = false;
      Result = 1;
      SP.get()[1] = -1;
      SP.get()[2] = -1;
      SP.get()[3] = -1;
      inQuote = false;
      Q = "\x00";
      i = 1;
      FL = Fmt.length;
      while (i <= FL) {
        C = Fmt.charAt(i - 1);
        var $tmp = C;
        if ($tmp === ";") {
          if (!inQuote) {
            if (Result > 3) throw $mod.Exception.$create("Create$1",["Invalid float format"]);
            SP.get()[Result] = i;
            Result += 1;
          };
        } else if (($tmp === '"') || ($tmp === "'")) {
          if (inQuote) {
            inQuote = C !== Q}
           else {
            inQuote = true;
            Q = C;
          };
        };
        i += 1;
      };
      if (SP.get()[Result] === -1) SP.get()[Result] = FL + 1;
      return Result;
    };
    function AnalyzeFormat() {
      var I = 0;
      var Len = 0;
      var Q = "\x00";
      var C = "\x00";
      var InQuote = false;
      Len = Section.length;
      I = 1;
      InQuote = false;
      Q = "\x00";
      while (I <= Len) {
        C = Section.charAt(I - 1);
        if (C.charCodeAt() in rtl.createSet(34,39)) {
          if (InQuote) {
            InQuote = C !== Q}
           else {
            InQuote = true;
            Q = C;
          };
        } else if (!InQuote) {
          var $tmp = C;
          if ($tmp === ".") {
            if (DecimalPos === 0) DecimalPos = RequestedDigits + 1}
           else if ($tmp === ",") {
            ThousandSep = aSettings.ThousandSeparator !== "\x00"}
           else if (($tmp === "e") || ($tmp === "E")) {
            I += 1;
            if (I < Len) {
              C = Section.charAt(I - 1);
              IsScientific = C.charCodeAt() in rtl.createSet(45,43);
              if (IsScientific) while ((I < Len) && (Section.charAt((I + 1) - 1) === "0")) {
                ExpSize += 1;
                I += 1;
              };
              if (ExpSize > 4) ExpSize = 4;
            };
          } else if ($tmp === "#") {
            RequestedDigits += 1}
           else if ($tmp === "0") {
            if (RequestedDigits < FirstDigit) FirstDigit = RequestedDigits + 1;
            RequestedDigits += 1;
            LastDigit = RequestedDigits + 1;
          };
        };
        I += 1;
      };
      if (DecimalPos === 0) DecimalPos = RequestedDigits + 1;
      LastDigit = DecimalPos - LastDigit;
      if (LastDigit > 0) LastDigit = 0;
      FirstDigit = DecimalPos - FirstDigit;
      if (FirstDigit < 0) FirstDigit = 0;
    };
    function ValueOutSideScope() {
      var Result = false;
      Result = ((FV.Exponent >= 18) && !IsScientific) || (FV.Exponent === 0x7FF) || (FV.Exponent === 0x800);
      return Result;
    };
    function CalcRunVars() {
      var D = 0;
      var P = 0;
      if (IsScientific) {
        P = RequestedDigits;
        D = 9999;
      } else {
        P = 18;
        D = (RequestedDigits - DecimalPos) + 1;
      };
      FV.$assign($mod.FloatToDecimal(aValue,P,D));
      DistToDecimal = DecimalPos - 1;
      if (IsScientific) {
        PadZeroes = 0}
       else {
        PadZeroes = FV.Exponent - (DecimalPos - 1);
        if (PadZeroes >= 0) DistToDecimal = FV.Exponent;
      };
      Available = -1;
      while ((Available < 18) && (FV.Digits[Available + 1] !== "\x00")) Available += 1;
    };
    function FormatExponent(ASign, aExponent) {
      var Result = "";
      Result = $mod.IntToStr(aExponent);
      Result = pas.System.StringOfChar("0",ExpSize - Result.length) + Result;
      if (aExponent < 0) {
        Result = "-" + Result}
       else if ((aExponent > 0) && (ASign === "+")) Result = ASign + Result;
      return Result;
    };
    var I = 0;
    var S = 0;
    var C = "\x00";
    var Q = "\x00";
    var PA = [];
    var InLiteral = false;
    PA = rtl.arraySetLength(PA,0,4);
    Result = "";
    InitVars();
    if (E > 0) {
      S = 1}
     else if (E < 0) {
      S = 2}
     else S = 3;
    PA[0] = 0;
    I = GetSections({get: function () {
        return PA;
      }, set: function (v) {
        PA = v;
      }});
    if ((I < S) || ((PA[S] - PA[S - 1]) === 0)) S = 1;
    SectionLength = PA[S] - PA[S - 1] - 1;
    Section = pas.System.Copy(Fmt,PA[S - 1] + 1,SectionLength);
    Section = rtl.strSetLength(Section,SectionLength);
    AnalyzeFormat();
    CalcRunVars();
    if ((SectionLength === 0) || ValueOutSideScope()) {
      Section=E.toPrecision(15);
      Result = Section;
    };
    I = 1;
    Current = 0;
    Q = " ";
    InLiteral = false;
    if (FV.Negative && (S === 1)) ToResult("-");
    while (I <= SectionLength) {
      C = Section.charAt(I - 1);
      if (C.charCodeAt() in rtl.createSet(34,39)) {
        if (InLiteral) {
          InLiteral = C !== Q}
         else {
          InLiteral = true;
          Q = C;
        };
      } else if (InLiteral) {
        ToResult(C)}
       else {
        var $tmp = C;
        if (($tmp === "0") || ($tmp === "#")) {
          CopyDigit()}
         else if (($tmp === ".") || ($tmp === ",")) {}
        else if (($tmp === "e") || ($tmp === "E")) {
          ToResult(C);
          I += 1;
          if (I <= Section.length) {
            C = Section.charAt(I - 1);
            if (C.charCodeAt() in rtl.createSet(43,45)) {
              AddToResult(FormatExponent(C,(FV.Exponent - DecimalPos) + 1));
              while ((I < SectionLength) && (Section.charAt((I + 1) - 1) === "0")) I += 1;
            };
          };
        } else {
          ToResult(C);
        };
      };
      I += 1;
    };
    return Result;
  };
  this.$rtti.$DynArray("FalseBoolStrs$a",{eltype: rtl.string});
  this.TrueBoolStrs = [];
  this.FalseBoolStrs = [];
  this.StrToBool = function (S) {
    var Result = false;
    if (!$mod.TryStrToBool(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidBoolean"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.BoolToStr = function (B, UseBoolStrs) {
    var Result = "";
    if (UseBoolStrs) {
      $impl.CheckBoolStrs();
      if (B) {
        Result = $mod.TrueBoolStrs[0]}
       else Result = $mod.FalseBoolStrs[0];
    } else if (B) {
      Result = "-1"}
     else Result = "0";
    return Result;
  };
  this.BoolToStr$1 = function (B, TrueS, FalseS) {
    var Result = "";
    if (B) {
      Result = TrueS}
     else Result = FalseS;
    return Result;
  };
  this.StrToBoolDef = function (S, Default) {
    var Result = false;
    if (!$mod.TryStrToBool(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = Default;
    return Result;
  };
  this.TryStrToBool = function (S, Value) {
    var Result = false;
    var Temp = "";
    var I = 0;
    var D = 0.0;
    var Code = 0;
    Temp = $mod.UpperCase(S);
    pas.System.val$8(Temp,{get: function () {
        return D;
      }, set: function (v) {
        D = v;
      }},{get: function () {
        return Code;
      }, set: function (v) {
        Code = v;
      }});
    Result = true;
    if (Code === 0) {
      Value.set(D !== 0.0)}
     else {
      $impl.CheckBoolStrs();
      for (var $l = 0, $end = rtl.length($mod.TrueBoolStrs) - 1; $l <= $end; $l++) {
        I = $l;
        if (Temp === $mod.UpperCase($mod.TrueBoolStrs[I])) {
          Value.set(true);
          return Result;
        };
      };
      for (var $l1 = 0, $end1 = rtl.length($mod.FalseBoolStrs) - 1; $l1 <= $end1; $l1++) {
        I = $l1;
        if (Temp === $mod.UpperCase($mod.FalseBoolStrs[I])) {
          Value.set(false);
          return Result;
        };
      };
      Result = false;
    };
    return Result;
  };
  this.ConfigExtension = ".cfg";
  this.SysConfigDir = "";
  this.$rtti.$ProcVar("TOnGetEnvironmentVariable",{procsig: rtl.newTIProcSig([["EnvVar",rtl.string,2]],rtl.string)});
  this.$rtti.$ProcVar("TOnGetEnvironmentString",{procsig: rtl.newTIProcSig([["Index",rtl.longint]],rtl.string)});
  this.$rtti.$ProcVar("TOnGetEnvironmentVariableCount",{procsig: rtl.newTIProcSig([],rtl.longint)});
  this.$rtti.$ProcVar("TShowExceptionHandler",{procsig: rtl.newTIProcSig([["Msg",rtl.string,2]])});
  this.$rtti.$RefToProcVar("TUncaughtPascalExceptionHandler",{procsig: rtl.newTIProcSig([["aObject",pas.System.$rtti["TObject"]]])});
  this.$rtti.$RefToProcVar("TUncaughtJSExceptionHandler",{procsig: rtl.newTIProcSig([["aObject",pas.JS.$rtti["TJSObject"]]])});
  this.OnGetEnvironmentVariable = null;
  this.OnGetEnvironmentString = null;
  this.OnGetEnvironmentVariableCount = null;
  this.OnShowException = null;
  this.SetOnUnCaughtExceptionHandler = function (aValue) {
    var Result = null;
    Result = $impl.OnPascalException;
    $impl.OnPascalException = aValue;
    $mod.HookUncaughtExceptions();
    return Result;
  };
  this.SetOnUnCaughtExceptionHandler$1 = function (aValue) {
    var Result = null;
    Result = $impl.OnJSException;
    $impl.OnJSException = aValue;
    $mod.HookUncaughtExceptions();
    return Result;
  };
  this.HookUncaughtExceptions = function () {
    rtl.onUncaughtException = $impl.RTLExceptionHook;
    rtl.showUncaughtExceptions = true;
  };
  this.GetEnvironmentVariable = function (EnvVar) {
    var Result = "";
    if ($mod.OnGetEnvironmentVariable != null) {
      Result = $mod.OnGetEnvironmentVariable(EnvVar)}
     else Result = "";
    return Result;
  };
  this.GetEnvironmentVariableCount = function () {
    var Result = 0;
    if ($mod.OnGetEnvironmentVariableCount != null) {
      Result = $mod.OnGetEnvironmentVariableCount()}
     else Result = 0;
    return Result;
  };
  this.GetEnvironmentString = function (Index) {
    var Result = "";
    if ($mod.OnGetEnvironmentString != null) {
      Result = $mod.OnGetEnvironmentString(Index)}
     else Result = "";
    return Result;
  };
  this.ShowException = function (ExceptObject, ExceptAddr) {
    var S = "";
    S = rtl.getResStr($mod,"SApplicationException") + ExceptObject.$classname;
    if ($mod.Exception.isPrototypeOf(ExceptObject)) S = S + " : " + ExceptObject.fMessage;
    $impl.DoShowException(S);
    if (ExceptAddr === null) ;
  };
  this.Abort = function () {
    throw $mod.EAbort.$create("Create$1",[rtl.getResStr($mod,"SAbortError")]);
  };
  this.TEventType = {"0": "etCustom", etCustom: 0, "1": "etInfo", etInfo: 1, "2": "etWarning", etWarning: 2, "3": "etError", etError: 3, "4": "etDebug", etDebug: 4};
  this.$rtti.$Enum("TEventType",{minvalue: 0, maxvalue: 4, ordtype: 1, enumtype: this.TEventType});
  this.$rtti.$Set("TEventTypes",{comptype: this.$rtti["TEventType"]});
  rtl.recNewT(this,"TSystemTime",function () {
    this.Year = 0;
    this.Month = 0;
    this.Day = 0;
    this.DayOfWeek = 0;
    this.Hour = 0;
    this.Minute = 0;
    this.Second = 0;
    this.MilliSecond = 0;
    this.$eq = function (b) {
      return (this.Year === b.Year) && (this.Month === b.Month) && (this.Day === b.Day) && (this.DayOfWeek === b.DayOfWeek) && (this.Hour === b.Hour) && (this.Minute === b.Minute) && (this.Second === b.Second) && (this.MilliSecond === b.MilliSecond);
    };
    this.$assign = function (s) {
      this.Year = s.Year;
      this.Month = s.Month;
      this.Day = s.Day;
      this.DayOfWeek = s.DayOfWeek;
      this.Hour = s.Hour;
      this.Minute = s.Minute;
      this.Second = s.Second;
      this.MilliSecond = s.MilliSecond;
      return this;
    };
    var $r = $mod.$rtti.$Record("TSystemTime",{},this);
    $r.addField("Year",rtl.word);
    $r.addField("Month",rtl.word);
    $r.addField("Day",rtl.word);
    $r.addField("DayOfWeek",rtl.word);
    $r.addField("Hour",rtl.word);
    $r.addField("Minute",rtl.word);
    $r.addField("Second",rtl.word);
    $r.addField("MilliSecond",rtl.word);
  });
  rtl.recNewT(this,"TTimeStamp",function () {
    this.Time = 0;
    this.Date = 0;
    this.$eq = function (b) {
      return (this.Time === b.Time) && (this.Date === b.Date);
    };
    this.$assign = function (s) {
      this.Time = s.Time;
      this.Date = s.Date;
      return this;
    };
    var $r = $mod.$rtti.$Record("TTimeStamp",{},this);
    $r.addField("Time",rtl.longint);
    $r.addField("Date",rtl.longint);
  });
  this.TimeSeparator = "\x00";
  this.DateSeparator = "\x00";
  this.ShortDateFormat = "";
  this.LongDateFormat = "";
  this.ShortTimeFormat = "";
  this.LongTimeFormat = "";
  this.DecimalSeparator = "";
  this.ThousandSeparator = "";
  this.TimeAMString = "";
  this.TimePMString = "";
  this.HoursPerDay = 24;
  this.MinsPerHour = 60;
  this.SecsPerMin = 60;
  this.MSecsPerSec = 1000;
  this.MinsPerDay = 24 * 60;
  this.SecsPerHour = 60 * 60;
  this.SecsPerDay = 1440 * 60;
  this.MSecsPerDay = 86400 * 1000;
  this.MaxDateTime = 2958465.99999999;
  this.MinDateTime = -693593.99999999;
  this.JulianEpoch = -2415018.5;
  this.UnixEpoch = -2415018.5 + 2440587.5;
  this.DateDelta = 693594;
  this.UnixDateDelta = 25569;
  this.MonthDays$a$clone = function (a) {
    var b = [];
    b.length = 2;
    for (var c = 0; c < 2; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("MonthDays$a",{dims: [2,12], eltype: rtl.word});
  this.MonthDays = [[31,28,31,30,31,30,31,31,30,31,30,31],[31,29,31,30,31,30,31,31,30,31,30,31]];
  this.ShortMonthNames = rtl.arraySetLength(null,"",12);
  this.LongMonthNames = rtl.arraySetLength(null,"",12);
  this.ShortDayNames = rtl.arraySetLength(null,"",7);
  this.LongDayNames = rtl.arraySetLength(null,"",7);
  this.FormatSettings = this.TFormatSettings.$new();
  this.TwoDigitYearCenturyWindow = 50;
  this.DateTimeToJSDate = function (aDateTime, asUTC) {
    var Result = null;
    var Y = 0;
    var M = 0;
    var D = 0;
    var h = 0;
    var n = 0;
    var s = 0;
    var z = 0;
    $mod.DecodeDate(pas.System.Trunc(aDateTime),{get: function () {
        return Y;
      }, set: function (v) {
        Y = v;
      }},{get: function () {
        return M;
      }, set: function (v) {
        M = v;
      }},{get: function () {
        return D;
      }, set: function (v) {
        D = v;
      }});
    $mod.DecodeTime(pas.System.Frac(aDateTime),{get: function () {
        return h;
      }, set: function (v) {
        h = v;
      }},{get: function () {
        return n;
      }, set: function (v) {
        n = v;
      }},{get: function () {
        return s;
      }, set: function (v) {
        s = v;
      }},{get: function () {
        return z;
      }, set: function (v) {
        z = v;
      }});
    if (asUTC) {
      Result = new Date(Date.UTC(Y,M - 1,D,h,n,s,z))}
     else Result = new Date(Y,M - 1,D,h,n,s,z);
    return Result;
  };
  this.JSDateToDateTime = function (aDate, asUTC) {
    var Result = 0.0;
    if (asUTC) {
      Result = $mod.EncodeDate(aDate.getUTCFullYear(),aDate.getUTCMonth() + 1,aDate.getUTCDate()) + $mod.EncodeTime(aDate.getUTCHours(),aDate.getUTCMinutes(),aDate.getUTCSeconds(),aDate.getUTCMilliseconds())}
     else Result = $mod.EncodeDate(aDate.getFullYear(),aDate.getMonth() + 1,aDate.getDate()) + $mod.EncodeTime(aDate.getHours(),aDate.getMinutes(),aDate.getSeconds(),aDate.getMilliseconds());
    return Result;
  };
  this.DateTimeToTimeStamp = function (DateTime) {
    var Result = $mod.TTimeStamp.$new();
    var D = 0.0;
    D = DateTime * 86400000;
    if (D < 0) {
      D = D - 0.5}
     else D = D + 0.5;
    Result.Time = pas.System.Trunc(Math.abs(pas.System.Trunc(D)) % 86400000);
    Result.Date = 693594 + rtl.trunc(pas.System.Trunc(D) / 86400000);
    return Result;
  };
  this.TimeStampToDateTime = function (TimeStamp) {
    var Result = 0.0;
    Result = $mod.ComposeDateTime(TimeStamp.Date - 693594,TimeStamp.Time / 86400000);
    return Result;
  };
  this.MSecsToTimeStamp = function (MSecs) {
    var Result = $mod.TTimeStamp.$new();
    Result.Date = pas.System.Trunc(MSecs / 86400000);
    MSecs = MSecs - (Result.Date * 86400000);
    Result.Time = Math.round(MSecs);
    return Result;
  };
  this.TimeStampToMSecs = function (TimeStamp) {
    var Result = 0;
    Result = TimeStamp.Time + (TimeStamp.Date * 86400000);
    return Result;
  };
  this.DateTimeToSystemTime = function (DateTime, SystemTime) {
    $mod.DecodeDateFully(DateTime,{p: SystemTime, get: function () {
        return this.p.Year;
      }, set: function (v) {
        this.p.Year = v;
      }},{p: SystemTime, get: function () {
        return this.p.Month;
      }, set: function (v) {
        this.p.Month = v;
      }},{p: SystemTime, get: function () {
        return this.p.Day;
      }, set: function (v) {
        this.p.Day = v;
      }},{p: SystemTime, get: function () {
        return this.p.DayOfWeek;
      }, set: function (v) {
        this.p.DayOfWeek = v;
      }});
    $mod.DecodeTime(DateTime,{p: SystemTime, get: function () {
        return this.p.Hour;
      }, set: function (v) {
        this.p.Hour = v;
      }},{p: SystemTime, get: function () {
        return this.p.Minute;
      }, set: function (v) {
        this.p.Minute = v;
      }},{p: SystemTime, get: function () {
        return this.p.Second;
      }, set: function (v) {
        this.p.Second = v;
      }},{p: SystemTime, get: function () {
        return this.p.MilliSecond;
      }, set: function (v) {
        this.p.MilliSecond = v;
      }});
    SystemTime.DayOfWeek -= 1;
  };
  this.SystemTimeToDateTime = function (SystemTime) {
    var Result = 0.0;
    Result = $mod.ComposeDateTime($impl.DoEncodeDate(SystemTime.Year,SystemTime.Month,SystemTime.Day),$impl.DoEncodeTime(SystemTime.Hour,SystemTime.Minute,SystemTime.Second,SystemTime.MilliSecond));
    return Result;
  };
  this.FloatToDateTime = function (Value) {
    var Result = 0.0;
    if ((Value < $mod.MinDateTime) || (Value > $mod.MaxDateTime)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidDateTime"),pas.System.VarRecs(18,$mod.FloatToStr(Value))]);
    Result = Value;
    return Result;
  };
  this.TryEncodeDate = function (Year, Month, Day, date) {
    var Result = false;
    var c = 0;
    var ya = 0;
    Result = (Year > 0) && (Year < 10000) && (Month >= 1) && (Month <= 12) && (Day > 0) && (Day <= $mod.MonthDays[+$mod.IsLeapYear(Year)][Month - 1]);
    if (Result) {
      if (Month > 2) {
        Month -= 3}
       else {
        Month += 9;
        Year -= 1;
      };
      c = rtl.trunc(Year / 100);
      ya = Year - (100 * c);
      date.set(((146097 * c) >>> 2) + ((1461 * ya) >>> 2) + rtl.trunc(((153 * Month) + 2) / 5) + Day);
      date.set(date.get() - 693900);
    };
    return Result;
  };
  this.TryEncodeTime = function (Hour, Min, Sec, MSec, Time) {
    var Result = false;
    Result = (Hour < 24) && (Min < 60) && (Sec < 60) && (MSec < 1000);
    if (Result) Time.set(((Hour * 3600000) + (Min * 60000) + (Sec * 1000) + MSec) / 86400000);
    return Result;
  };
  this.EncodeDate = function (Year, Month, Day) {
    var Result = 0.0;
    if (!$mod.TryEncodeDate(Year,Month,Day,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",["%s-%s-%s is not a valid date specification",pas.System.VarRecs(18,$mod.IntToStr(Year),18,$mod.IntToStr(Month),18,$mod.IntToStr(Day))]);
    return Result;
  };
  this.EncodeTime = function (Hour, Minute, Second, MilliSecond) {
    var Result = 0.0;
    if (!$mod.TryEncodeTime(Hour,Minute,Second,MilliSecond,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",["%s:%s:%s.%s is not a valid time specification",pas.System.VarRecs(18,$mod.IntToStr(Hour),18,$mod.IntToStr(Minute),18,$mod.IntToStr(Second),18,$mod.IntToStr(MilliSecond))]);
    return Result;
  };
  this.DecodeDate = function (date, Year, Month, Day) {
    var ly = 0;
    var ld = 0;
    var lm = 0;
    var j = 0;
    if (date <= -693594) {
      Year.set(0);
      Month.set(0);
      Day.set(0);
    } else {
      if (date > 0) {
        date = date + (1 / (86400000 * 2))}
       else date = date - (1 / (86400000 * 2));
      if (date > $mod.MaxDateTime) date = $mod.MaxDateTime;
      j = rtl.shl(pas.System.Trunc(date) + 693900,2) - 1;
      ly = rtl.trunc(j / 146097);
      j = j - (146097 * ly);
      ld = rtl.lw(j >>> 2);
      j = rtl.trunc((rtl.lw(ld << 2) + 3) / 1461);
      ld = rtl.lw(((rtl.lw(ld << 2) + 7) - (1461 * j)) >>> 2);
      lm = rtl.trunc(((5 * ld) - 3) / 153);
      ld = rtl.trunc((((5 * ld) + 2) - (153 * lm)) / 5);
      ly = (100 * ly) + j;
      if (lm < 10) {
        lm += 3}
       else {
        lm -= 9;
        ly += 1;
      };
      Year.set(ly);
      Month.set(lm);
      Day.set(ld);
    };
  };
  this.DecodeTime = function (Time, Hour, Minute, Second, MilliSecond) {
    var l = 0;
    l = $mod.DateTimeToTimeStamp(Time).Time;
    Hour.set(rtl.trunc(l / 3600000));
    l = l % 3600000;
    Minute.set(rtl.trunc(l / 60000));
    l = l % 60000;
    Second.set(rtl.trunc(l / 1000));
    l = l % 1000;
    MilliSecond.set(l);
  };
  this.DecodeDateFully = function (DateTime, Year, Month, Day, DOW) {
    var Result = false;
    $mod.DecodeDate(DateTime,Year,Month,Day);
    DOW.set($mod.DayOfWeek(DateTime));
    Result = $mod.IsLeapYear(Year.get());
    return Result;
  };
  this.ComposeDateTime = function (date, Time) {
    var Result = 0.0;
    if (date < 0) {
      Result = pas.System.Trunc(date) - Math.abs(pas.System.Frac(Time))}
     else Result = pas.System.Trunc(date) + Math.abs(pas.System.Frac(Time));
    return Result;
  };
  this.ReplaceTime = function (dati, NewTime) {
    dati.set($mod.ComposeDateTime(dati.get(),NewTime));
  };
  this.ReplaceDate = function (DateTime, NewDate) {
    var tmp = 0.0;
    tmp = NewDate;
    $mod.ReplaceTime({get: function () {
        return tmp;
      }, set: function (v) {
        tmp = v;
      }},DateTime.get());
    DateTime.set(tmp);
  };
  this.Date = function () {
    var Result = 0.0;
    Result = pas.System.Trunc($mod.Now());
    return Result;
  };
  this.Time = function () {
    var Result = 0.0;
    Result = $mod.Now() - $mod.Date();
    return Result;
  };
  this.Now = function () {
    var Result = 0.0;
    Result = $mod.JSDateToDateTime(new Date(),false);
    return Result;
  };
  this.NowUTC = function () {
    var Result = 0.0;
    Result = $mod.JSDateToDateTime(new Date(),true);
    return Result;
  };
  this.DayOfWeek = function (DateTime) {
    var Result = 0;
    Result = 1 + ((pas.System.Trunc(DateTime) - 1) % 7);
    if (Result <= 0) Result += 7;
    return Result;
  };
  this.IncMonth = function (DateTime, NumberOfMonths) {
    var Result = 0.0;
    var Year = 0;
    var Month = 0;
    var Day = 0;
    $mod.DecodeDate(DateTime,{get: function () {
        return Year;
      }, set: function (v) {
        Year = v;
      }},{get: function () {
        return Month;
      }, set: function (v) {
        Month = v;
      }},{get: function () {
        return Day;
      }, set: function (v) {
        Day = v;
      }});
    $mod.IncAMonth({get: function () {
        return Year;
      }, set: function (v) {
        Year = v;
      }},{get: function () {
        return Month;
      }, set: function (v) {
        Month = v;
      }},{get: function () {
        return Day;
      }, set: function (v) {
        Day = v;
      }},NumberOfMonths);
    Result = $mod.ComposeDateTime($impl.DoEncodeDate(Year,Month,Day),DateTime);
    return Result;
  };
  this.IncAMonth = function (Year, Month, Day, NumberOfMonths) {
    var TempMonth = 0;
    var S = 0;
    if (NumberOfMonths >= 0) {
      S = 1}
     else S = -1;
    Year.set(Year.get() + rtl.trunc(NumberOfMonths / 12));
    TempMonth = (Month.get() + (NumberOfMonths % 12)) - 1;
    if ((TempMonth > 11) || (TempMonth < 0)) {
      TempMonth -= S * 12;
      Year.set(Year.get() + S);
    };
    Month.set(TempMonth + 1);
    if (Day.get() > $mod.MonthDays[+$mod.IsLeapYear(Year.get())][Month.get() - 1]) Day.set($mod.MonthDays[+$mod.IsLeapYear(Year.get())][Month.get() - 1]);
  };
  this.IsLeapYear = function (Year) {
    var Result = false;
    Result = ((Year % 4) === 0) && (((Year % 100) !== 0) || ((Year % 400) === 0));
    return Result;
  };
  this.CurrentYear = function () {
    var Result = 0;
    Result = (new Date()).getFullYear();
    return Result;
  };
  this.DateToStr = function (date) {
    var Result = "";
    Result = $mod.DateToStr$1(date,$mod.FormatSettings);
    return Result;
  };
  this.DateToStr$1 = function (date, aSettings) {
    var Result = "";
    Result = $mod.FormatDateTime$1("ddddd",date,aSettings);
    return Result;
  };
  this.StrToDate = function (S) {
    var Result = 0.0;
    Result = $mod.StrToDate$3(S,$mod.FormatSettings);
    return Result;
  };
  this.StrToDate$1 = function (S, separator) {
    var Result = 0.0;
    Result = $mod.StrToDate$2(S,$mod.FormatSettings.ShortDateFormat,separator);
    return Result;
  };
  this.StrToDate$2 = function (S, useformat, separator) {
    var Result = 0.0;
    var MSg = "";
    Result = $impl.IntStrToDate({get: function () {
        return MSg;
      }, set: function (v) {
        MSg = v;
      }},S,useformat,separator);
    if (MSg !== "") throw $mod.EConvertError.$create("Create$1",[MSg]);
    return Result;
  };
  this.StrToDate$3 = function (S, aSettings) {
    var Result = 0.0;
    Result = $mod.StrToDate$2(S,aSettings.ShortDateFormat,aSettings.DateSeparator);
    return Result;
  };
  this.TryStrToDate = function (S, Value) {
    var Result = false;
    Result = $mod.TryStrToDate$1(S,Value,$mod.FormatSettings);
    return Result;
  };
  this.TryStrToDate$1 = function (S, Value, aSettings) {
    var Result = false;
    Result = $mod.TryStrToDate$3(S,Value,aSettings.ShortDateFormat,aSettings.DateSeparator);
    return Result;
  };
  this.TryStrToDate$2 = function (S, Value, separator) {
    var Result = false;
    Result = $mod.TryStrToDate$3(S,Value,$mod.FormatSettings.ShortDateFormat,separator);
    return Result;
  };
  this.TryStrToDate$3 = function (S, Value, useformat, separator) {
    var Result = false;
    var Msg = "";
    Result = S.length !== 0;
    if (Result) {
      Value.set($impl.IntStrToDate({get: function () {
          return Msg;
        }, set: function (v) {
          Msg = v;
        }},S,useformat,separator));
      Result = Msg === "";
    };
    return Result;
  };
  this.StrToDateDef = function (S, Defvalue) {
    var Result = 0.0;
    Result = $mod.StrToDateDef$1(S,Defvalue,"\x00");
    return Result;
  };
  this.StrToDateDef$1 = function (S, Defvalue, separator) {
    var Result = 0.0;
    if (!$mod.TryStrToDate$2(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},separator)) Result = Defvalue;
    return Result;
  };
  this.TimeToStr = function (Time) {
    var Result = "";
    Result = $mod.TimeToStr$1(Time,$mod.FormatSettings);
    return Result;
  };
  this.TimeToStr$1 = function (Time, aSettings) {
    var Result = "";
    Result = $mod.FormatDateTime$1("tt",Time,aSettings);
    return Result;
  };
  this.StrToTime = function (S) {
    var Result = 0.0;
    Result = $mod.StrToTime$2(S,$mod.FormatSettings);
    return Result;
  };
  this.StrToTime$1 = function (S, separator) {
    var Result = 0.0;
    var aSettings = $mod.TFormatSettings.$new();
    aSettings.$assign($mod.TFormatSettings.Create());
    aSettings.TimeSeparator = separator;
    Result = $mod.StrToTime$2(S,aSettings);
    return Result;
  };
  this.StrToTime$2 = function (S, aSettings) {
    var Result = 0.0;
    var Msg = "";
    Result = $impl.IntStrToTime({get: function () {
        return Msg;
      }, set: function (v) {
        Msg = v;
      }},S,S.length,aSettings);
    if (Msg !== "") throw $mod.EConvertError.$create("Create$1",[Msg]);
    return Result;
  };
  this.TryStrToTime = function (S, Value) {
    var Result = false;
    Result = $mod.TryStrToTime$1(S,Value,$mod.TFormatSettings.$clone($mod.FormatSettings));
    return Result;
  };
  this.TryStrToTime$1 = function (S, Value, aSettings) {
    var Result = false;
    var Msg = "";
    Result = S.length !== 0;
    if (Result) {
      Value.set($impl.IntStrToTime({get: function () {
          return Msg;
        }, set: function (v) {
          Msg = v;
        }},S,S.length,aSettings));
      Result = Msg === "";
    };
    return Result;
  };
  this.TryStrToTime$2 = function (S, Value, separator) {
    var Result = false;
    var Fmt = $mod.TFormatSettings.$new();
    Fmt.$assign($mod.TFormatSettings.Create());
    Fmt.TimeSeparator = separator;
    Result = $mod.TryStrToTime$1(S,Value,$mod.TFormatSettings.$clone(Fmt));
    return Result;
  };
  this.StrToTimeDef = function (S, Defvalue) {
    var Result = 0.0;
    Result = $mod.StrToTimeDef$1(S,Defvalue,"\x00");
    return Result;
  };
  this.StrToTimeDef$1 = function (S, Defvalue, separator) {
    var Result = 0.0;
    if (!$mod.TryStrToTime$2(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},separator)) Result = Defvalue;
    return Result;
  };
  this.StrToTimeDef$2 = function (AString, ADefault, aSettings) {
    var Result = 0.0;
    if (!$mod.TryStrToTime$1(AString,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},$mod.TFormatSettings.$clone(aSettings))) Result = ADefault;
    return Result;
  };
  this.DateTimeToStr = function (DateTime, ForceTimeIfZero) {
    var Result = "";
    Result = $mod.DateTimeToStr$1(DateTime,$mod.FormatSettings,ForceTimeIfZero);
    return Result;
  };
  this.DateTimeToStr$1 = function (DateTime, aSettings, ForceTimeIfZero) {
    var Result = "";
    Result = $mod.FormatDateTime$1($impl.DateTimeToStrFormat[+ForceTimeIfZero],DateTime,aSettings);
    return Result;
  };
  this.StrToDateTime = function (S) {
    var Result = 0.0;
    Result = $mod.StrToDateTime$1(S,$mod.FormatSettings);
    return Result;
  };
  this.StrToDateTime$1 = function (s, aSettings) {
    var Result = 0.0;
    var TimeStr = "";
    var DateStr = "";
    var PartsFound = 0;
    PartsFound = $impl.SplitDateTimeStr(s,{get: function () {
        return DateStr;
      }, set: function (v) {
        DateStr = v;
      }},{get: function () {
        return TimeStr;
      }, set: function (v) {
        TimeStr = v;
      }},aSettings);
    var $tmp = PartsFound;
    if ($tmp === 0) {
      Result = $mod.StrToDate("")}
     else if ($tmp === 1) {
      if (DateStr.length > 0) {
        Result = $mod.StrToDate$2(DateStr,aSettings.ShortDateFormat,aSettings.DateSeparator)}
       else Result = $mod.StrToTime(TimeStr)}
     else if ($tmp === 2) Result = $mod.ComposeDateTime($mod.StrToDate$2(DateStr,aSettings.ShortDateFormat,aSettings.DateSeparator),$mod.StrToTime(TimeStr));
    return Result;
  };
  this.TryStrToDateTime = function (S, Value) {
    var Result = false;
    Result = $mod.TryStrToDateTime$1(S,Value,$mod.FormatSettings);
    return Result;
  };
  this.TryStrToDateTime$1 = function (S, Value, aSettings) {
    var Result = false;
    var I = 0;
    var dtdate = 0.0;
    var dttime = 0.0;
    Result = false;
    I = pas.System.Pos(aSettings.TimeSeparator,S);
    if (I > 0) {
      while ((I > 0) && (S.charAt(I - 1) !== " ")) I -= 1;
      if (I > 0) {
        if (!$mod.TryStrToDate$1(pas.System.Copy(S,1,I - 1),{get: function () {
            return dtdate;
          }, set: function (v) {
            dtdate = v;
          }},aSettings)) return Result;
        if (!$mod.TryStrToTime$1(pas.System.Copy(S,I + 1,S.length - I),{get: function () {
            return dttime;
          }, set: function (v) {
            dttime = v;
          }},$mod.TFormatSettings.$clone(aSettings))) return Result;
        Value.set($mod.ComposeDateTime(dtdate,dttime));
        Result = true;
      } else Result = $mod.TryStrToTime$1(S,Value,$mod.TFormatSettings.$clone(aSettings));
    } else Result = $mod.TryStrToDate$1(S,Value,aSettings);
    return Result;
  };
  this.StrToDateTimeDef = function (S, Defvalue) {
    var Result = 0.0;
    Result = $mod.StrToDateTimeDef$1(S,Defvalue,$mod.TFormatSettings.$clone($mod.FormatSettings));
    return Result;
  };
  this.StrToDateTimeDef$1 = function (S, Defvalue, aSettings) {
    var Result = 0.0;
    if (!$mod.TryStrToDateTime$1(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},aSettings)) Result = Defvalue;
    return Result;
  };
  this.FormatDateTime = function (aFormatStr, DateTime) {
    var Result = "";
    Result = $mod.FormatDateTime$1(aFormatStr,DateTime,$mod.FormatSettings);
    return Result;
  };
  this.FormatDateTime$1 = function (aFormatStr, DateTime, aSettings) {
    var Result = "";
    function StoreString(AStr) {
      Result = Result + AStr;
    };
    function StoreInt(Value, Digits) {
      var S = "";
      S = $mod.IntToStr(Value);
      while (S.length < Digits) S = "0" + S;
      StoreString(S);
    };
    var Year = 0;
    var Month = 0;
    var Day = 0;
    var DayOfWeek = 0;
    var Hour = 0;
    var Minute = 0;
    var Second = 0;
    var MilliSecond = 0;
    function StoreFormat(FormatStr, Nesting, TimeFlag) {
      function StoreStr(APos, Len) {
        Result = Result + pas.System.Copy(aFormatStr,APos,Len);
      };
      var Token = "\x00";
      var lastformattoken = "\x00";
      var prevlasttoken = "\x00";
      var Count = 0;
      var Clock12 = false;
      var tmp = 0;
      var isInterval = false;
      var P = 0;
      var FormatCurrent = 0;
      var FormatEnd = 0;
      if (Nesting > 1) return;
      FormatCurrent = 1;
      FormatEnd = FormatStr.length;
      Clock12 = false;
      isInterval = false;
      P = 1;
      while (P <= FormatEnd) {
        Token = FormatStr.charAt(P - 1);
        var $tmp = Token;
        if (($tmp === "'") || ($tmp === '"')) {
          P += 1;
          while ((P < FormatEnd) && (FormatStr.charAt(P - 1) !== Token)) P += 1;
        } else if (($tmp === "A") || ($tmp === "a")) {
          if (($mod.CompareText(pas.System.Copy(FormatStr,P,3),"A/P") === 0) || ($mod.CompareText(pas.System.Copy(FormatStr,P,4),"AMPM") === 0) || ($mod.CompareText(pas.System.Copy(FormatStr,P,5),"AM/PM") === 0)) {
            Clock12 = true;
            break;
          };
        };
        P += 1;
      };
      Token = "ÿ";
      lastformattoken = " ";
      prevlasttoken = "H";
      while (FormatCurrent <= FormatEnd) {
        Token = $mod.UpperCase(FormatStr.charAt(FormatCurrent - 1)).charAt(0);
        Count = 1;
        P = FormatCurrent + 1;
        var $tmp1 = Token;
        if (($tmp1 === "'") || ($tmp1 === '"')) {
          while ((P < FormatEnd) && (FormatStr.charAt(P - 1) !== Token)) P += 1;
          P += 1;
          Count = P - FormatCurrent;
          StoreStr(FormatCurrent + 1,Count - 2);
        } else if ($tmp1 === "A") {
          if ($mod.CompareText(pas.System.Copy(FormatStr,FormatCurrent,4),"AMPM") === 0) {
            Count = 4;
            if (Hour < 12) {
              StoreString(aSettings.TimeAMString)}
             else StoreString(aSettings.TimePMString);
          } else if ($mod.CompareText(pas.System.Copy(FormatStr,FormatCurrent,5),"AM/PM") === 0) {
            Count = 5;
            if (Hour < 12) {
              StoreStr(FormatCurrent,2)}
             else StoreStr(FormatCurrent + 3,2);
          } else if ($mod.CompareText(pas.System.Copy(FormatStr,FormatCurrent,3),"A/P") === 0) {
            Count = 3;
            if (Hour < 12) {
              StoreStr(FormatCurrent,1)}
             else StoreStr(FormatCurrent + 2,1);
          } else throw $mod.EConvertError.$create("Create$1",["Illegal character in format string"]);
        } else if ($tmp1 === "/") {
          StoreString(aSettings.DateSeparator);
        } else if ($tmp1 === ":") {
          StoreString(aSettings.TimeSeparator)}
         else if (($tmp1 === " ") || ($tmp1 === "C") || ($tmp1 === "D") || ($tmp1 === "H") || ($tmp1 === "M") || ($tmp1 === "N") || ($tmp1 === "S") || ($tmp1 === "T") || ($tmp1 === "Y") || ($tmp1 === "Z") || ($tmp1 === "F")) {
          while ((P <= FormatEnd) && ($mod.UpperCase(FormatStr.charAt(P - 1)) === Token)) P += 1;
          Count = P - FormatCurrent;
          var $tmp2 = Token;
          if ($tmp2 === " ") {
            StoreStr(FormatCurrent,Count)}
           else if ($tmp2 === "Y") {
            if (Count > 2) {
              StoreInt(Year,4)}
             else StoreInt(Year % 100,2);
          } else if ($tmp2 === "M") {
            if (isInterval && ((prevlasttoken === "H") || TimeFlag)) {
              StoreInt(Minute + ((Hour + (pas.System.Trunc(Math.abs(DateTime)) * 24)) * 60),0)}
             else if ((lastformattoken === "H") || TimeFlag) {
              if (Count === 1) {
                StoreInt(Minute,0)}
               else StoreInt(Minute,2);
            } else {
              var $tmp3 = Count;
              if ($tmp3 === 1) {
                StoreInt(Month,0)}
               else if ($tmp3 === 2) {
                StoreInt(Month,2)}
               else if ($tmp3 === 3) {
                StoreString(aSettings.ShortMonthNames[Month - 1])}
               else {
                StoreString(aSettings.LongMonthNames[Month - 1]);
              };
            };
          } else if ($tmp2 === "D") {
            var $tmp4 = Count;
            if ($tmp4 === 1) {
              StoreInt(Day,0)}
             else if ($tmp4 === 2) {
              StoreInt(Day,2)}
             else if ($tmp4 === 3) {
              StoreString(aSettings.ShortDayNames[DayOfWeek - 1])}
             else if ($tmp4 === 4) {
              StoreString(aSettings.LongDayNames[DayOfWeek - 1])}
             else if ($tmp4 === 5) {
              StoreFormat(aSettings.ShortDateFormat,Nesting + 1,false)}
             else {
              StoreFormat(aSettings.LongDateFormat,Nesting + 1,false);
            };
          } else if ($tmp2 === "H") {
            if (isInterval) {
              StoreInt(Hour + (pas.System.Trunc(Math.abs(DateTime)) * 24),0)}
             else if (Clock12) {
              tmp = Hour % 12;
              if (tmp === 0) tmp = 12;
              if (Count === 1) {
                StoreInt(tmp,0)}
               else StoreInt(tmp,2);
            } else {
              if (Count === 1) {
                StoreInt(Hour,0)}
               else StoreInt(Hour,2);
            }}
           else if ($tmp2 === "N") {
            if (isInterval) {
              StoreInt(Minute + ((Hour + (pas.System.Trunc(Math.abs(DateTime)) * 24)) * 60),0)}
             else if (Count === 1) {
              StoreInt(Minute,0)}
             else StoreInt(Minute,2)}
           else if ($tmp2 === "S") {
            if (isInterval) {
              StoreInt(Second + ((Minute + ((Hour + (pas.System.Trunc(Math.abs(DateTime)) * 24)) * 60)) * 60),0)}
             else if (Count === 1) {
              StoreInt(Second,0)}
             else StoreInt(Second,2)}
           else if ($tmp2 === "Z") {
            if (Count === 1) {
              StoreInt(MilliSecond,0)}
             else StoreInt(MilliSecond,3)}
           else if ($tmp2 === "T") {
            if (Count === 1) {
              StoreFormat(aSettings.ShortTimeFormat,Nesting + 1,true)}
             else StoreFormat(aSettings.LongTimeFormat,Nesting + 1,true)}
           else if ($tmp2 === "C") {
            StoreFormat(aSettings.ShortDateFormat,Nesting + 1,false);
            if ((Hour !== 0) || (Minute !== 0) || (Second !== 0)) {
              StoreString(" ");
              StoreFormat(aSettings.LongTimeFormat,Nesting + 1,true);
            };
          } else if ($tmp2 === "F") {
            StoreFormat(aSettings.ShortDateFormat,Nesting + 1,false);
            StoreString(" ");
            StoreFormat(aSettings.LongTimeFormat,Nesting + 1,true);
          };
          prevlasttoken = lastformattoken;
          lastformattoken = Token;
        } else {
          StoreString(Token);
        };
        FormatCurrent += Count;
      };
    };
    $mod.DecodeDateFully(DateTime,{get: function () {
        return Year;
      }, set: function (v) {
        Year = v;
      }},{get: function () {
        return Month;
      }, set: function (v) {
        Month = v;
      }},{get: function () {
        return Day;
      }, set: function (v) {
        Day = v;
      }},{get: function () {
        return DayOfWeek;
      }, set: function (v) {
        DayOfWeek = v;
      }});
    $mod.DecodeTime(DateTime,{get: function () {
        return Hour;
      }, set: function (v) {
        Hour = v;
      }},{get: function () {
        return Minute;
      }, set: function (v) {
        Minute = v;
      }},{get: function () {
        return Second;
      }, set: function (v) {
        Second = v;
      }},{get: function () {
        return MilliSecond;
      }, set: function (v) {
        MilliSecond = v;
      }});
    if (aFormatStr !== "") {
      StoreFormat(aFormatStr,0,false)}
     else StoreFormat("C",0,false);
    return Result;
  };
  this.GetLocalTimeOffset = function () {
    var Result = 0;
    Result = (new Date()).getTimezoneOffset();
    return Result;
  };
  this.GetLocalTimeOffset$1 = function (DateTime, InputIsUTC, Offset) {
    var Result = false;
    Offset.set($mod.DateTimeToJSDate(DateTime,InputIsUTC).getTimezoneOffset());
    Result = true;
    return Result;
  };
  this.GetLocalTimeOffset$2 = function (DateTime, InputIsUTC) {
    var Result = 0;
    if (!$mod.GetLocalTimeOffset$1(DateTime,InputIsUTC,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) Result = $mod.GetLocalTimeOffset();
    return Result;
  };
  this.CurrencyFormat = 0;
  this.NegCurrFormat = 0;
  this.CurrencyDecimals = 0;
  this.CurrencyString = "";
  this.FloattoCurr = function (Value) {
    var Result = 0;
    if (!$mod.TryFloatToCurr(Value,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidCurrency"),pas.System.VarRecs(18,$mod.FloatToStr(Value))]);
    return Result;
  };
  this.TryFloatToCurr = function (Value, AResult) {
    var Result = false;
    Result = ((Value * 10000) >= $mod.MinCurrency) && ((Value * 10000) <= $mod.MaxCurrency);
    if (Result) AResult.set(rtl.trunc(Value * 10000));
    return Result;
  };
  this.CurrToStr = function (Value) {
    var Result = "";
    Result = $mod.FloatToStrF$1(Value / 10000,$mod.TFloatFormat.ffGeneral,-1,0,$mod.FormatSettings);
    return Result;
  };
  this.CurrToStr$1 = function (Value, aSettings) {
    var Result = "";
    Result = $mod.FloatToStrF$1(Value / 10000,$mod.TFloatFormat.ffGeneral,-1,0,aSettings);
    return Result;
  };
  this.StrToCurr = function (S) {
    var Result = 0;
    if (!$mod.TryStrToCurr(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }})) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidCurrency"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.StrToCurr$1 = function (S, aSettings) {
    var Result = 0;
    if (!$mod.TryStrToCurr$1(S,{get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},aSettings)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidCurrency"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.TryStrToCurr = function (S, Value) {
    var Result = false;
    var D = 0.0;
    Result = $mod.TryStrToFloat$3(S,{get: function () {
        return D;
      }, set: function (v) {
        D = v;
      }},$mod.FormatSettings);
    if (Result) Value.set(rtl.trunc(D * 10000));
    return Result;
  };
  this.TryStrToCurr$1 = function (S, Value, aSettings) {
    var Result = false;
    var D = 0.0;
    Result = $mod.TryStrToFloat$3(S,{get: function () {
        return D;
      }, set: function (v) {
        D = v;
      }},aSettings);
    if (Result) Value.set(rtl.trunc(D * 10000));
    return Result;
  };
  this.StrToCurrDef = function (S, Default) {
    var Result = 0;
    var R = 0;
    if ($mod.TryStrToCurr$1(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }},$mod.FormatSettings)) {
      Result = R}
     else Result = Default;
    return Result;
  };
  this.StrToCurrDef$1 = function (S, Default, aSettings) {
    var Result = 0;
    var R = 0;
    if ($mod.TryStrToCurr$1(S,{get: function () {
        return R;
      }, set: function (v) {
        R = v;
      }},aSettings)) {
      Result = R}
     else Result = Default;
    return Result;
  };
  this.$rtti.$DynArray("TPathStrArray",{eltype: rtl.string});
  this.ChangeFileExt = function (FileName, Extension) {
    var Result = "";
    var i = 0;
    var EndSep = {};
    var SOF = false;
    i = FileName.length;
    EndSep = rtl.unionSet(rtl.unionSet(pas.System.AllowDirectorySeparators,pas.System.AllowDriveSeparators),rtl.createSet(pas.System.ExtensionSeparator.charCodeAt()));
    while ((i > 0) && !(FileName.charCodeAt(i - 1) in EndSep)) i -= 1;
    if ((i === 0) || (FileName.charAt(i - 1) !== pas.System.ExtensionSeparator)) {
      i = FileName.length + 1}
     else {
      SOF = (i === 1) || (FileName.charCodeAt(i - 1 - 1) in pas.System.AllowDirectorySeparators);
      if (SOF && !pas.System.FirstDotAtFileNameStartIsExtension) i = FileName.length + 1;
    };
    Result = pas.System.Copy(FileName,1,i - 1) + Extension;
    return Result;
  };
  this.ExtractFilePath = function (FileName) {
    var Result = "";
    var i = 0;
    var EndSep = {};
    i = FileName.length;
    EndSep = rtl.unionSet(pas.System.AllowDirectorySeparators,pas.System.AllowDriveSeparators);
    while ((i > 0) && !$impl.CharInSet$1(FileName.charAt(i - 1),EndSep)) i -= 1;
    if (i > 0) {
      Result = pas.System.Copy(FileName,1,i)}
     else Result = "";
    return Result;
  };
  this.ExtractFileDrive = function (FileName) {
    var Result = "";
    var i = 0;
    var l = 0;
    Result = "";
    l = FileName.length;
    if (l < 2) return Result;
    if ($impl.CharInSet$1(FileName.charAt(1),pas.System.AllowDriveSeparators)) {
      Result = pas.System.Copy(FileName,1,2)}
     else if ($impl.CharInSet$1(FileName.charAt(0),pas.System.AllowDirectorySeparators) && $impl.CharInSet$1(FileName.charAt(1),pas.System.AllowDirectorySeparators)) {
      i = 2;
      while ((i < l) && !$impl.CharInSet$1(FileName.charAt((i + 1) - 1),pas.System.AllowDirectorySeparators)) i += 1;
      i += 1;
      while ((i < l) && !$impl.CharInSet$1(FileName.charAt((i + 1) - 1),pas.System.AllowDirectorySeparators)) i += 1;
      Result = pas.System.Copy(FileName,1,i);
    };
    return Result;
  };
  this.ExtractFileName = function (FileName) {
    var Result = "";
    var i = 0;
    var EndSep = {};
    i = FileName.length;
    EndSep = rtl.unionSet(pas.System.AllowDirectorySeparators,pas.System.AllowDriveSeparators);
    while ((i > 0) && !$impl.CharInSet$1(FileName.charAt(i - 1),EndSep)) i -= 1;
    Result = pas.System.Copy(FileName,i + 1,2147483647);
    return Result;
  };
  this.ExtractFileExt = function (FileName) {
    var Result = "";
    var i = 0;
    var EndSep = {};
    var SOF = false;
    Result = "";
    i = FileName.length;
    EndSep = rtl.unionSet(rtl.unionSet(pas.System.AllowDirectorySeparators,pas.System.AllowDriveSeparators),rtl.createSet(pas.System.ExtensionSeparator.charCodeAt()));
    while ((i > 0) && !$impl.CharInSet$1(FileName.charAt(i - 1),EndSep)) i -= 1;
    if ((i > 0) && (FileName.charAt(i - 1) === pas.System.ExtensionSeparator)) {
      SOF = (i === 1) || (FileName.charCodeAt(i - 1 - 1) in pas.System.AllowDirectorySeparators);
      if (!SOF || pas.System.FirstDotAtFileNameStartIsExtension) Result = pas.System.Copy(FileName,i,2147483647);
    } else Result = "";
    return Result;
  };
  this.ExtractFileDir = function (FileName) {
    var Result = "";
    var i = 0;
    var EndSep = {};
    i = FileName.length;
    EndSep = rtl.unionSet(pas.System.AllowDirectorySeparators,pas.System.AllowDriveSeparators);
    while ((i > 0) && !$impl.CharInSet$1(FileName.charAt(i - 1),EndSep)) i -= 1;
    if ((i > 1) && $impl.CharInSet$1(FileName.charAt(i - 1),pas.System.AllowDirectorySeparators) && !$impl.CharInSet$1(FileName.charAt(i - 1 - 1),EndSep)) i -= 1;
    Result = pas.System.Copy(FileName,1,i);
    return Result;
  };
  this.ExtractRelativepath = function (BaseName, DestName) {
    var Result = "";
    var OneLevelBack = "";
    var Source = "";
    var Dest = "";
    var Sc = 0;
    var Dc = 0;
    var I = 0;
    var J = 0;
    var SD = [];
    var DD = [];
    OneLevelBack = ".." + pas.System.PathDelim;
    if ($mod.UpperCase($mod.ExtractFileDrive(BaseName)) !== $mod.UpperCase($mod.ExtractFileDrive(DestName))) {
      Result = DestName;
      return Result;
    };
    Source = $mod.ExcludeTrailingPathDelimiter($mod.ExtractFilePath(BaseName));
    Dest = $mod.ExcludeTrailingPathDelimiter($mod.ExtractFilePath(DestName));
    SD = $mod.GetDirs(Source);
    Sc = rtl.length(SD);
    DD = $mod.GetDirs(Dest);
    Dc = rtl.length(SD);
    I = 0;
    while ((I < Dc) && (I < Sc)) {
      if ($mod.SameText(DD[I],SD[I])) {
        I += 1}
       else break;
    };
    Result = "";
    for (var $l = I, $end = Sc; $l <= $end; $l++) {
      J = $l;
      Result = Result + OneLevelBack;
    };
    for (var $l1 = I, $end1 = Dc; $l1 <= $end1; $l1++) {
      J = $l1;
      Result = Result + DD[J] + pas.System.PathDelim;
    };
    Result = Result + $mod.ExtractFileName(DestName);
    return Result;
  };
  this.IncludeTrailingPathDelimiter = function (Path) {
    var Result = "";
    var l = 0;
    Result = Path;
    l = Result.length;
    if ((l === 0) || !$impl.CharInSet$1(Result.charAt(l - 1),pas.System.AllowDirectorySeparators)) Result = Result + pas.System.PathDelim;
    return Result;
  };
  this.ExcludeTrailingPathDelimiter = function (Path) {
    var Result = "";
    var L = 0;
    L = Path.length;
    if ((L > 0) && $impl.CharInSet$1(Path.charAt(L - 1),pas.System.AllowDirectorySeparators)) L -= 1;
    Result = pas.System.Copy(Path,1,L);
    return Result;
  };
  this.IncludeLeadingPathDelimiter = function (Path) {
    var Result = "";
    var l = 0;
    Result = Path;
    l = Result.length;
    if ((l === 0) || !$impl.CharInSet$1(Result.charAt(0),pas.System.AllowDirectorySeparators)) Result = pas.System.PathDelim + Result;
    return Result;
  };
  this.ExcludeLeadingPathDelimiter = function (Path) {
    var Result = "";
    var L = 0;
    Result = Path;
    L = Result.length;
    if ((L > 0) && $impl.CharInSet$1(Result.charAt(0),pas.System.AllowDirectorySeparators)) pas.System.Delete({get: function () {
        return Result;
      }, set: function (v) {
        Result = v;
      }},1,1);
    return Result;
  };
  this.IsPathDelimiter = function (Path, Index) {
    var Result = false;
    Result = (Index > 0) && (Index <= Path.length) && $impl.CharInSet$1(Path.charAt(Index - 1),pas.System.AllowDirectorySeparators);
    return Result;
  };
  this.SetDirSeparators = function (FileName) {
    var Result = "";
    var I = 0;
    Result = FileName;
    for (var $l = 1, $end = Result.length; $l <= $end; $l++) {
      I = $l;
      if ($impl.CharInSet$1(Result.charAt(I - 1),pas.System.AllowDirectorySeparators)) Result = rtl.setCharAt(Result,I - 1,pas.System.PathDelim);
    };
    return Result;
  };
  this.GetDirs = function (DirName) {
    var Result = [];
    var I = 0;
    var J = 0;
    var L = 0;
    var D = "";
    I = 1;
    J = 0;
    L = 0;
    Result = rtl.arraySetLength(Result,"",DirName.length);
    while (I <= DirName.length) {
      if ($impl.CharInSet$1(DirName.charAt(I - 1),pas.System.AllowDirectorySeparators)) {
        D = pas.System.Copy(DirName,J + 1,J - I);
        if (D !== "") {
          Result[L] = D;
          L += 1;
        };
        J = I;
      };
      I += 1;
    };
    Result = rtl.arraySetLength(Result,"",L);
    return Result;
  };
  this.ConcatPaths = function (Paths) {
    var Result = "";
    var I = 0;
    if (rtl.length(Paths) > 0) {
      Result = Paths[0];
      for (var $l = 1, $end = rtl.length(Paths) - 1; $l <= $end; $l++) {
        I = $l;
        Result = $mod.IncludeTrailingPathDelimiter(Result) + $mod.ExcludeLeadingPathDelimiter(Paths[I]);
      };
    } else Result = "";
    return Result;
  };
  this.GUID_NULL = pas.System.TGuid.$clone({D1: 0x00000000, D2: 0x0000, D3: 0x0000, D4: [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]});
  this.Supports = function (Instance, AClass, Obj) {
    var Result = false;
    Result = (Instance !== null) && (Instance.QueryInterface(pas.System.IObjectInstance,Obj) === 0) && Obj.get().$class.InheritsFrom(AClass);
    return Result;
  };
  this.Supports$1 = function (Instance, IID, Intf) {
    var Result = false;
    Result = (Instance !== null) && (Instance.QueryInterface(IID,Intf) === 0);
    return Result;
  };
  this.Supports$2 = function (Instance, IID, Intf) {
    var Result = false;
    Result = (Instance !== null) && Instance.GetInterface(IID,Intf);
    return Result;
  };
  this.Supports$3 = function (Instance, IID, Intf) {
    var Result = false;
    Result = (Instance !== null) && Instance.GetInterfaceByStr(IID,Intf);
    return Result;
  };
  this.Supports$4 = function (Instance, AClass) {
    var Result = false;
    var Temp = null;
    Result = $mod.Supports(Instance,AClass,{get: function () {
        return Temp;
      }, set: function (v) {
        Temp = v;
      }});
    return Result;
  };
  this.Supports$5 = function (Instance, IID) {
    var Result = false;
    var Temp = null;
    try {
      Result = $mod.Supports$1(Instance,IID,{get: function () {
          return Temp;
        }, set: function (v) {
          Temp = v;
        }});
    } finally {
      rtl._Release(Temp);
    };
    return Result;
  };
  this.Supports$6 = function (Instance, IID) {
    var Result = false;
    var Temp = null;
    Result = $mod.Supports$2(Instance,IID,{get: function () {
        return Temp;
      }, set: function (v) {
        Temp = v;
      }});
    if (Temp && Temp.$kind==='com') Temp._Release();
    return Result;
  };
  this.Supports$7 = function (Instance, IID) {
    var Result = false;
    var Temp = null;
    Result = $mod.Supports$3(Instance,IID,{get: function () {
        return Temp;
      }, set: function (v) {
        Temp = v;
      }});
    if (Temp && Temp.$kind==='com') Temp._Release();
    return Result;
  };
  this.Supports$8 = function (AClass, IID) {
    var Result = false;
    var maps = undefined;
    if (AClass === null) return false;
    maps = AClass["$intfmaps"];
    if (!maps) return false;
    if (maps[$mod.GUIDToString(IID)]) return true;
    Result = false;
    return Result;
  };
  this.Supports$9 = function (AClass, IID) {
    var Result = false;
    var maps = undefined;
    if (AClass === null) return false;
    maps = AClass["$intfmaps"];
    if (!maps) return false;
    if (maps[$mod.UpperCase(IID)]) return true;
    Result = false;
    return Result;
  };
  this.TryStringToGUID = function (s, Guid) {
    var Result = false;
    var re = null;
    if (s.length !== 38) return false;
    re = new RegExp("^\\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\}$");
    Result = re.test(s);
    if (!Result) {
      Guid.D1 = 0;
      return Result;
    };
    rtl.strToGUIDR(s,Guid);
    Result = true;
    return Result;
  };
  this.StringToGUID = function (S) {
    var Result = pas.System.TGuid.$new();
    if (!$mod.TryStringToGUID(S,Result)) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidGUID"),pas.System.VarRecs(18,S)]);
    return Result;
  };
  this.GUIDToString = function (guid) {
    var Result = "";
    Result = rtl.guidrToStr(guid);
    return Result;
  };
  this.IsEqualGUID = function (guid1, guid2) {
    var Result = false;
    var i = 0;
    if ((guid1.D1 !== guid2.D1) || (guid1.D2 !== guid2.D2) || (guid1.D3 !== guid2.D3)) return false;
    for (i = 0; i <= 7; i++) if (guid1.D4[i] !== guid2.D4[i]) return false;
    Result = true;
    return Result;
  };
  this.GuidCase = function (guid, List) {
    var Result = 0;
    for (var $l = rtl.length(List) - 1; $l >= 0; $l--) {
      Result = $l;
      if ($mod.IsEqualGUID(guid,List[Result])) return Result;
    };
    Result = -1;
    return Result;
  };
  this.CreateGUID = function (GUID) {
    var Result = 0;
    function R(B) {
      var Result = 0;
      var v = 0;
      v = pas.System.Random(256);
      while (B > 1) {
        v = (v * 256) + pas.System.Random(256);
        B -= 1;
      };
      Result = v;
      return Result;
    };
    var I = 0;
    Result = 0;
    GUID.D1 = R(4);
    GUID.D2 = R(2);
    GUID.D3 = R(2);
    for (I = 0; I <= 7; I++) GUID.D4[I] = R(1);
    return Result;
  };
  this.EncodeHTMLEntities = function (S) {
    var Result = "";
    Result = "";
    if (S === "") return Result;
    return S.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
      return '&#'+i.charCodeAt(0)+';';
    });
    return Result;
  };
  this.$rtti.$DynArray("TCharArray",{eltype: rtl.char});
  this.$rtti.$Int("TByteBitIndex",{minvalue: 0, maxvalue: 7, ordtype: 1});
  this.$rtti.$Int("TShortIntBitIndex",{minvalue: 0, maxvalue: 7, ordtype: 1});
  this.$rtti.$Int("TWordBitIndex",{minvalue: 0, maxvalue: 15, ordtype: 1});
  this.$rtti.$Int("TSmallIntBitIndex",{minvalue: 0, maxvalue: 15, ordtype: 1});
  this.$rtti.$Int("TCardinalBitIndex",{minvalue: 0, maxvalue: 31, ordtype: 1});
  this.$rtti.$Int("TIntegerBitIndex",{minvalue: 0, maxvalue: 31, ordtype: 1});
  this.$rtti.$Int("TQwordBitIndex",{minvalue: 0, maxvalue: 52, ordtype: 1});
  this.$rtti.$Int("TInt64BitIndex",{minvalue: 0, maxvalue: 52, ordtype: 1});
  this.$rtti.$Int("TNativeIntBitIndex",{minvalue: 0, maxvalue: 52, ordtype: 1});
  this.$rtti.$Int("TNativeUIntBitIndex",{minvalue: 0, maxvalue: 52, ordtype: 1});
  this.CPUEndian = this.TEndian.Big;
  rtl.createHelper(this,"TGuidHelper",null,function () {
    this.Create = function (Src, BigEndian) {
      var Result = pas.System.TGuid.$new();
      Result.$assign(Src);
      if (!BigEndian) {
        Result.D1 = $mod.SwapEndian$1(Result.D1);
        Result.D2 = $mod.SwapEndian(Result.D2);
        Result.D3 = $mod.SwapEndian(Result.D3);
      };
      return Result;
    };
    this.Create$1 = function (Buf, AStartIndex, BigEndian) {
      var Result = pas.System.TGuid.$new();
      var A = 0;
      var B = 0;
      var C = 0;
      var V = null;
      V = new DataView(Buf);
      if (BigEndian) {
        A = V.getUint32(AStartIndex);
        B = V.getUint16(AStartIndex + 4);
        C = V.getUint16(AStartIndex + 6);
      } else {
        A = $mod.SwapEndian$1(V.getUint32(AStartIndex));
        B = $mod.SwapEndian(V.getUint16(AStartIndex + 4));
        C = $mod.SwapEndian(V.getUint16(AStartIndex + 6));
      };
      Result.$assign($mod.TGuidHelper.Create$7(A,B,C,V.getUint8(AStartIndex + 8),V.getUint8(AStartIndex + 9),V.getUint8(AStartIndex + 10),V.getUint8(AStartIndex + 11),V.getUint8(AStartIndex + 12),V.getUint8(AStartIndex + 13),V.getUint8(AStartIndex + 14),V.getUint8(AStartIndex + 15)));
      return Result;
    };
    this.Create$2 = function (Data, AStartIndex, BigEndian) {
      var Result = pas.System.TGuid.$new();
      var D = null;
      if ((rtl.length(Data) - AStartIndex) < 16) throw $mod.EArgumentException.$create("CreateFmt",["The length of a GUID array must be at least %d",[]]);
      D = Uint8Array.from(Data);
      Result.$assign($mod.TGuidHelper.Create$1(D.buffer,AStartIndex,BigEndian));
      return Result;
    };
    this.Create$3 = function (B, DataEndian) {
      var Result = pas.System.TGuid.$new();
      Result.$assign($mod.TGuidHelper.Create$4(B,0,DataEndian));
      return Result;
    };
    this.Create$4 = function (B, AStartIndex, DataEndian) {
      var Result = pas.System.TGuid.$new();
      if ((rtl.length(B) - AStartIndex) < 16) throw $mod.EArgumentException.$create("CreateFmt",["The length of a GUID array must be at least %d",[]]);
      Result.$assign($mod.TGuidHelper.Create$2(B,AStartIndex,DataEndian === $mod.TEndian.Big));
      return Result;
    };
    this.Create$5 = function (S) {
      var Result = pas.System.TGuid.$new();
      Result.$assign($mod.StringToGUID(S));
      return Result;
    };
    this.Create$6 = function (A, B, C, D) {
      var Result = pas.System.TGuid.$new();
      if (rtl.length(D) !== 8) throw $mod.EArgumentException.$create("CreateFmt",["The length of a GUID array must be %d",[]]);
      Result.$assign($mod.TGuidHelper.Create$7(A >>> 0,B & 65535,C & 65535,D[0],D[1],D[2],D[3],D[4],D[5],D[6],D[7]));
      return Result;
    };
    this.Create$7 = function (A, B, C, D, E, F, G, H, I, J, K) {
      var Result = pas.System.TGuid.$new();
      Result.D1 = A;
      Result.D2 = B;
      Result.D3 = C;
      Result.D4[0] = D;
      Result.D4[1] = E;
      Result.D4[2] = F;
      Result.D4[3] = G;
      Result.D4[4] = H;
      Result.D4[5] = I;
      Result.D4[6] = J;
      Result.D4[7] = K;
      return Result;
    };
    this.NewGuid = function () {
      var Result = pas.System.TGuid.$new();
      $mod.CreateGUID(Result);
      return Result;
    };
    this.Empty = function () {
      var Result = pas.System.TGuid.$new();
      Result.$assign(pas.System.TGuid.$new());
      return Result;
    };
    this.ToByteArray = function (DataEndian) {
      var Result = [];
      var D = null;
      var V = null;
      var I = 0;
      D = new Uint8Array(16);
      V = new DataView(D.buffer);
      V.setUint32(0,this.D1,DataEndian === $mod.TEndian.Little);
      V.setUint16(4,this.D2,DataEndian === $mod.TEndian.Little);
      V.setUint16(6,this.D3,DataEndian === $mod.TEndian.Little);
      for (I = 0; I <= 7; I++) V.setUint8(8 + I,this.D4[I]);
      Result = rtl.arraySetLength(Result,0,16);
      for (I = 0; I <= 15; I++) Result[I] = V.getUint8(I);
      return Result;
    };
    this.ToString = function (SkipBrackets) {
      var Result = "";
      Result = $mod.GUIDToString(this);
      if (SkipBrackets) Result = pas.System.Copy(Result,2,Result.length - 2);
      return Result;
    };
  });
  this.TStringSplitOptions = {"0": "None", None: 0, "1": "ExcludeEmpty", ExcludeEmpty: 1};
  this.$rtti.$Enum("TStringSplitOptions",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TStringSplitOptions});
  rtl.createHelper(this,"TStringHelper",null,function () {
    this.Empty = "";
    this.GetChar = function (AIndex) {
      var Result = "\x00";
      Result = this.get().charAt((AIndex + 1) - 1);
      return Result;
    };
    this.GetLength = function () {
      var Result = 0;
      Result = this.get().length;
      return Result;
    };
    this.Compare = function (A, B) {
      var Result = 0;
      Result = $mod.TStringHelper.Compare$5(A,0,B,0,B.length,{});
      return Result;
    };
    this.Compare$1 = function (A, B, IgnoreCase) {
      var Result = 0;
      if (IgnoreCase) {
        Result = $mod.TStringHelper.Compare$2(A,B,rtl.createSet(pas.System.TCompareOption.coIgnoreCase))}
       else Result = $mod.TStringHelper.Compare$2(A,B,{});
      return Result;
    };
    this.Compare$2 = function (A, B, Options) {
      var Result = 0;
      Result = $mod.TStringHelper.Compare$5(A,0,B,0,B.length,rtl.refSet(Options));
      return Result;
    };
    this.Compare$3 = function (A, IndexA, B, IndexB, ALen) {
      var Result = 0;
      Result = $mod.TStringHelper.Compare$5(A,IndexA,B,IndexB,ALen,{});
      return Result;
    };
    this.Compare$4 = function (A, IndexA, B, IndexB, ALen, IgnoreCase) {
      var Result = 0;
      if (IgnoreCase) {
        Result = $mod.TStringHelper.Compare$5(A,IndexA,B,IndexB,ALen,rtl.createSet(pas.System.TCompareOption.coIgnoreCase))}
       else Result = $mod.TStringHelper.Compare$5(A,IndexA,B,IndexB,ALen,{});
      return Result;
    };
    this.Compare$5 = function (A, IndexA, B, IndexB, ALen, Options) {
      var Result = 0;
      var AL = "";
      var BL = "";
      AL = pas.System.Copy(A,IndexA + 1,ALen);
      BL = pas.System.Copy(B,IndexB + 1,ALen);
      if (pas.System.TCompareOption.coIgnoreCase in Options) {
        Result = $mod.TStringHelper.UpperCase(AL).localeCompare($mod.TStringHelper.UpperCase(BL))}
       else Result = AL.localeCompare(BL);
      return Result;
    };
    this.CompareOrdinal = function (A, B) {
      var Result = 0;
      var L = 0;
      L = B.length;
      if (L > A.length) L = A.length;
      Result = $mod.TStringHelper.CompareOrdinal$1(A,0,B,0,L);
      return Result;
    };
    this.CompareOrdinal$1 = function (A, IndexA, B, IndexB, ALen) {
      var Result = 0;
      var I = 0;
      var M = 0;
      M = A.length - IndexA;
      if (M > (B.length - IndexB)) M = B.length - IndexB;
      if (M > ALen) M = ALen;
      I = 0;
      Result = 0;
      while ((Result === 0) && (I < M)) {
        Result = A.charCodeAt(IndexA + I) - B.charCodeAt(IndexB + I);
        I += 1;
      };
      return Result;
    };
    this.CompareText = function (A, B) {
      var Result = 0;
      Result = $mod.CompareText(A,B);
      return Result;
    };
    this.Copy = function (Str) {
      var Result = "";
      Result = Str;
      return Result;
    };
    this.Create = function (AChar, ACount) {
      var Result = "";
      Result = pas.System.StringOfChar(AChar,ACount);
      return Result;
    };
    this.Create$1 = function (AValue) {
      var Result = "";
      Result = $mod.TStringHelper.Create$2(AValue,0,rtl.length(AValue));
      return Result;
    };
    this.Create$2 = function (AValue, StartIndex, ALen) {
      var Result = "";
      var I = 0;
      Result = rtl.strSetLength(Result,ALen);
      for (var $l = 1, $end = ALen; $l <= $end; $l++) {
        I = $l;
        Result = rtl.setCharAt(Result,I - 1,AValue[(StartIndex + I) - 1]);
      };
      return Result;
    };
    this.EndsText = function (ASubText, AText) {
      var Result = false;
      Result = (ASubText !== "") && ($mod.CompareText(pas.System.Copy(AText,(AText.length - ASubText.length) + 1,ASubText.length),ASubText) === 0);
      return Result;
    };
    this.Equals = function (a, b) {
      var Result = false;
      Result = a === b;
      return Result;
    };
    this.Format = function (AFormat, args) {
      var Result = "";
      Result = $mod.Format(AFormat,args);
      return Result;
    };
    this.IsNullOrEmpty = function (AValue) {
      var Result = false;
      Result = AValue.length === 0;
      return Result;
    };
    this.IsNullOrWhiteSpace = function (AValue) {
      var Result = false;
      Result = $mod.Trim(AValue).length === 0;
      return Result;
    };
    this.Join = function (Separator, Values) {
      var Result = "";
      Result = Values.join(Separator);
      return Result;
    };
    this.Join$1 = function (Separator, Values) {
      var Result = "";
      Result = Values.join(Separator);
      return Result;
    };
    this.Join$2 = function (Separator, Values, StartIndex, ACount) {
      var Result = "";
      var VLen = 0;
      VLen = rtl.length(Values) - 1;
      if ((ACount < 0) || ((StartIndex > 0) && (StartIndex > VLen))) throw $mod.ERangeError.$create("Create$1",[rtl.getResStr(pas.RTLConsts,"SRangeError")]);
      if ((ACount === 0) || (VLen < 0)) {
        Result = ""}
       else Result = Values.slice(StartIndex,StartIndex + ACount).join(Separator);
      return Result;
    };
    this.LowerCase = function (S) {
      var Result = "";
      Result = $mod.LowerCase(S);
      return Result;
    };
    this.Parse = function (AValue) {
      var Result = "";
      Result = $mod.BoolToStr(AValue,false);
      return Result;
    };
    this.Parse$1 = function (AValue) {
      var Result = "";
      Result = $mod.FloatToStr(AValue);
      return Result;
    };
    this.Parse$2 = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.Parse$3 = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.ToBoolean = function (S) {
      var Result = false;
      Result = $mod.StrToBool(S);
      return Result;
    };
    this.ToDouble = function (S) {
      var Result = 0.0;
      Result = $mod.StrToFloat(S);
      return Result;
    };
    this.ToExtended = function (S) {
      var Result = 0.0;
      Result = $mod.StrToFloat(S);
      return Result;
    };
    this.ToNativeInt = function (S) {
      var Result = 0;
      Result = $mod.StrToInt64(S);
      return Result;
    };
    this.ToInteger = function (S) {
      var Result = 0;
      Result = $mod.StrToInt(S);
      return Result;
    };
    this.UpperCase = function (S) {
      var Result = "";
      Result = $mod.UpperCase(S);
      return Result;
    };
    this.ToCharArray = function (S) {
      var Result = [];
      var I = 0;
      var Len = 0;
      Len = S.length;
      Result = rtl.arraySetLength(Result,"\x00",Len);
      for (var $l = 1, $end = Len; $l <= $end; $l++) {
        I = $l;
        Result[I - 1] = S.charAt(I - 1);
      };
      return Result;
    };
    this.CompareTo = function (B) {
      var Result = 0;
      Result = $mod.TStringHelper.Compare(this.get(),B);
      return Result;
    };
    this.Contains = function (AValue) {
      var Result = false;
      Result = (AValue !== "") && (pas.System.Pos(AValue,this.get()) > 0);
      return Result;
    };
    this.CountChar = function (C) {
      var Result = 0;
      var S = "\x00";
      Result = 0;
      for (var $in = this.get(), $l = 0, $end = $in.length - 1; $l <= $end; $l++) {
        S = $in.charAt($l);
        if (S === C) Result += 1;
      };
      return Result;
    };
    this.DeQuotedString = function () {
      var Result = "";
      Result = $mod.TStringHelper.DeQuotedString$1.call(this,"'");
      return Result;
    };
    this.DeQuotedString$1 = function (AQuoteChar) {
      var Result = "";
      var L = 0;
      var I = 0;
      var Res = [];
      var PS = 0;
      var PD = 0;
      var IsQuote = false;
      L = this.get().length;
      if ((L < 2) || !((this.get().charAt(0) === AQuoteChar) && (this.get().charAt(L - 1) === AQuoteChar))) return this.get();
      Res = rtl.arraySetLength(Res,"\x00",L);
      IsQuote = false;
      PS = 2;
      PD = 1;
      for (var $l = 2, $end = L - 1; $l <= $end; $l++) {
        I = $l;
        if (this.get().charAt(PS - 1) === AQuoteChar) {
          IsQuote = !IsQuote;
          if (!IsQuote) {
            Result = rtl.setCharAt(Result,PD - 1,this.get().charAt(PS - 1));
            PD += 1;
          };
        } else {
          if (IsQuote) IsQuote = false;
          Result = rtl.setCharAt(Result,PD - 1,this.get().charAt(PS - 1));
          PD += 1;
        };
        PS += 1;
      };
      Result = rtl.strSetLength(Result,PD - 1);
      return Result;
    };
    this.EndsWith = function (AValue) {
      var Result = false;
      Result = $mod.TStringHelper.EndsWith$1.call(this,AValue,false);
      return Result;
    };
    this.EndsWith$1 = function (AValue, IgnoreCase) {
      var Result = false;
      var L = 0;
      var S = "";
      L = AValue.length;
      Result = L === 0;
      if (!Result) {
        S = pas.System.Copy(this.get(),($mod.TStringHelper.GetLength.call(this) - L) + 1,L);
        Result = S.length === L;
        if (Result) if (IgnoreCase) {
          Result = $mod.TStringHelper.CompareText(S,AValue) === 0}
         else Result = S === AValue;
      };
      return Result;
    };
    this.Equals$1 = function (AValue) {
      var Result = false;
      Result = this.get() === AValue;
      return Result;
    };
    this.Format$1 = function (args) {
      var Result = "";
      Result = $mod.Format(this.get(),args);
      return Result;
    };
    this.GetHashCode = function () {
      var Result = 0;
      var P = 0;
      var pmax = 0;
      var L = null;
      L = this.get();
      Result = 0;
      P = 1;
      pmax = $mod.TStringHelper.GetLength.call(this) + 1;
      while (P < pmax) {
        Result = rtl.xor(((Result << 5) - Result) >>> 0,L.charCodeAt(P));
        P += 1;
      };
      return Result;
    };
    this.IndexOf = function (AValue) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOf$4.call(this,AValue,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOf$1 = function (AValue) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOf$5.call(this,AValue,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOf$2 = function (AValue, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOf$4.call(this,AValue,StartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOf$3 = function (AValue, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOf$5.call(this,AValue,StartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOf$4 = function (AValue, StartIndex, ACount) {
      var Result = 0;
      var S = "";
      S = pas.System.Copy(this.get(),StartIndex + 1,ACount);
      Result = pas.System.Pos(AValue,S) - 1;
      if (Result !== -1) Result = Result + StartIndex;
      return Result;
    };
    this.IndexOf$5 = function (AValue, StartIndex, ACount) {
      var Result = 0;
      var S = "";
      S = pas.System.Copy(this.get(),StartIndex + 1,ACount);
      Result = pas.System.Pos(AValue,S) - 1;
      if (Result !== -1) Result = Result + StartIndex;
      return Result;
    };
    this.IndexOfUnQuoted = function (AValue, StartQuote, EndQuote, StartIndex) {
      var $Self = this;
      var Result = 0;
      var LV = 0;
      var S = "";
      function MatchAt(I) {
        var Result = false;
        var J = 0;
        J = 1;
        do {
          Result = S.charAt((I + J) - 1 - 1) === AValue.charAt(J - 1);
          J += 1;
        } while (!(!Result || (J > LV)));
        return Result;
      };
      var I = 0;
      var L = 0;
      var Q = 0;
      S = $Self.get();
      Result = -1;
      LV = AValue.length;
      L = ($mod.TStringHelper.GetLength.call($Self) - LV) + 1;
      if (L < 0) L = 0;
      I = StartIndex + 1;
      Q = 0;
      if (StartQuote === EndQuote) {
        while ((Result === -1) && (I <= L)) {
          if (S.charAt(I - 1) === StartQuote) Q = 1 - Q;
          if ((Q === 0) && MatchAt(I)) Result = I - 1;
          I += 1;
        };
      } else {
        while ((Result === -1) && (I <= L)) {
          if (S.charAt(I - 1) === StartQuote) {
            Q += 1}
           else if ((S.charAt(I - 1) === EndQuote) && (Q > 0)) Q -= 1;
          if ((Q === 0) && MatchAt(I)) Result = I - 1;
          I += 1;
        };
      };
      return Result;
    };
    this.IndexOfAny = function (AnyOf) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$1.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return AnyOf;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}));
      return Result;
    };
    this.IndexOfAny$1 = function (AnyOf) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$5.call(this,AnyOf,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOfAny$2 = function (AnyOf, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$3.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return AnyOf;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),StartIndex);
      return Result;
    };
    this.IndexOfAny$3 = function (AnyOf, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$5.call(this,AnyOf,StartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOfAny$4 = function (AnyOf, StartIndex, ACount) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$5.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return AnyOf;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),StartIndex,ACount);
      return Result;
    };
    this.IndexOfAny$5 = function (AnyOf, StartIndex, ACount) {
      var Result = 0;
      var i = 0;
      var L = 0;
      i = StartIndex + 1;
      L = (i + ACount) - 1;
      if (L > $mod.TStringHelper.GetLength.call(this)) L = $mod.TStringHelper.GetLength.call(this);
      Result = -1;
      while ((Result === -1) && (i <= L)) {
        if ($impl.HaveChar(this.get().charAt(i - 1),AnyOf)) Result = i - 1;
        i += 1;
      };
      return Result;
    };
    this.IndexOfAny$6 = function (AnyOf) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$8.call(this,AnyOf,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOfAny$7 = function (AnyOf, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAny$8.call(this,AnyOf,StartIndex,$mod.TStringHelper.GetLength.call(this) - StartIndex);
      return Result;
    };
    this.IndexOfAny$8 = function (AnyOf, StartIndex, ACount) {
      var Result = 0;
      var M = 0;
      Result = $mod.TStringHelper.IndexOfAny$9.call(this,AnyOf,StartIndex,ACount,{get: function () {
          return M;
        }, set: function (v) {
          M = v;
        }});
      return Result;
    };
    this.IndexOfAny$9 = function (AnyOf, StartIndex, ACount, AMatch) {
      var Result = 0;
      var L = 0;
      var I = 0;
      Result = -1;
      for (var $l = 0, $end = rtl.length(AnyOf) - 1; $l <= $end; $l++) {
        I = $l;
        L = $mod.TStringHelper.IndexOf$5.call(this,AnyOf[I],StartIndex,ACount);
        if ((L >= 0) && ((Result === -1) || (L < Result))) {
          Result = L;
          AMatch.set(I);
        };
      };
      return Result;
    };
    this.IndexOfAnyUnquoted = function (AnyOf, StartQuote, EndQuote) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAnyUnquoted$2.call(this,AnyOf,StartQuote,EndQuote,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOfAnyUnquoted$1 = function (AnyOf, StartQuote, EndQuote, StartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.IndexOfAnyUnquoted$2.call(this,AnyOf,StartQuote,EndQuote,StartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.IndexOfAnyUnquoted$2 = function (AnyOf, StartQuote, EndQuote, StartIndex, ACount) {
      var Result = 0;
      var I = 0;
      var L = 0;
      var Q = 0;
      Result = -1;
      L = (StartIndex + ACount) - 1;
      if (L > $mod.TStringHelper.GetLength.call(this)) L = $mod.TStringHelper.GetLength.call(this);
      I = StartIndex + 1;
      Q = 0;
      if (StartQuote === EndQuote) {
        while ((Result === -1) && (I <= L)) {
          if (this.get().charAt(I - 1) === StartQuote) Q = 1 - Q;
          if ((Q === 0) && $impl.HaveChar(this.get().charAt(I - 1),AnyOf)) Result = I - 1;
          I += 1;
        };
      } else {
        while ((Result === -1) && (I <= L)) {
          if (this.get().charAt(I - 1) === StartQuote) {
            Q += 1}
           else if ((this.get().charAt(I - 1) === EndQuote) && (Q > 0)) Q -= 1;
          if ((Q === 0) && $impl.HaveChar(this.get().charAt(I - 1),AnyOf)) Result = I - 1;
          I += 1;
        };
      };
      return Result;
    };
    this.IndexOfAnyUnquoted$3 = function (AnyOf, StartQuote, EndQuote, StartIndex, Matched) {
      var Result = 0;
      var L = 0;
      var I = 0;
      Result = -1;
      for (var $l = 0, $end = rtl.length(AnyOf) - 1; $l <= $end; $l++) {
        I = $l;
        L = $mod.TStringHelper.IndexOfUnQuoted.call(this,AnyOf[I],StartQuote,EndQuote,StartIndex);
        if ((L >= 0) && ((Result === -1) || (L < Result))) {
          Result = L;
          Matched.set(I);
        };
      };
      return Result;
    };
    this.Insert = function (StartIndex, AValue) {
      var Result = "";
      pas.System.Insert(AValue,this,StartIndex + 1);
      Result = this.get();
      return Result;
    };
    this.IsDelimiter = function (Delimiters, Index) {
      var Result = false;
      Result = $mod.IsDelimiter(Delimiters,this.get(),Index + 1);
      return Result;
    };
    this.IsEmpty = function () {
      var Result = false;
      Result = $mod.TStringHelper.GetLength.call(this) === 0;
      return Result;
    };
    this.LastDelimiter = function (Delims) {
      var Result = 0;
      Result = $mod.LastDelimiter(Delims,this.get()) - 1;
      return Result;
    };
    this.LastIndexOf = function (AValue) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOf$4.call(this,AValue,$mod.TStringHelper.GetLength.call(this) - 1,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOf$1 = function (AValue) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOf$5.call(this,AValue,$mod.TStringHelper.GetLength.call(this) - 1,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOf$2 = function (AValue, AStartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOf$4.call(this,AValue,AStartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOf$3 = function (AValue, AStartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOf$5.call(this,AValue,AStartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOf$4 = function (AValue, AStartIndex, ACount) {
      var Result = 0;
      var Min = 0;
      Result = AStartIndex + 1;
      Min = (Result - ACount) + 1;
      if (Min < 1) Min = 1;
      while ((Result >= Min) && (this.get().charAt(Result - 1) !== AValue)) Result -= 1;
      if (Result < Min) {
        Result = -1}
       else Result = Result - 1;
      return Result;
    };
    this.LastIndexOf$5 = function (AValue, AStartIndex, ACount) {
      var Result = 0;
      Result = this.get().lastIndexOf(AValue,AStartIndex);
      if ((AStartIndex - Result) > ACount) Result = -1;
      return Result;
    };
    this.LastIndexOfAny = function (AnyOf) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOfAny$2.call(this,AnyOf,$mod.TStringHelper.GetLength.call(this) - 1,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOfAny$1 = function (AnyOf, AStartIndex) {
      var Result = 0;
      Result = $mod.TStringHelper.LastIndexOfAny$2.call(this,AnyOf,AStartIndex,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.LastIndexOfAny$2 = function (AnyOf, AStartIndex, ACount) {
      var Result = 0;
      var Min = 0;
      Result = AStartIndex + 1;
      Min = (Result - ACount) + 1;
      if (Min < 1) Min = 1;
      while ((Result >= Min) && !$impl.HaveChar(this.get().charAt(Result - 1),AnyOf)) Result -= 1;
      if (Result < Min) {
        Result = -1}
       else Result = Result - 1;
      return Result;
    };
    this.PadLeft = function (ATotalWidth) {
      var Result = "";
      Result = $mod.TStringHelper.PadLeft$1.call(this,ATotalWidth," ");
      return Result;
    };
    this.PadLeft$1 = function (ATotalWidth, PaddingChar) {
      var Result = "";
      var L = 0;
      Result = this.get();
      L = ATotalWidth - $mod.TStringHelper.GetLength.call(this);
      if (L > 0) Result = pas.System.StringOfChar(PaddingChar,L) + Result;
      return Result;
    };
    this.PadRight = function (ATotalWidth) {
      var Result = "";
      Result = $mod.TStringHelper.PadRight$1.call(this,ATotalWidth," ");
      return Result;
    };
    this.PadRight$1 = function (ATotalWidth, PaddingChar) {
      var Result = "";
      var L = 0;
      Result = this.get();
      L = ATotalWidth - $mod.TStringHelper.GetLength.call(this);
      if (L > 0) Result = Result + pas.System.StringOfChar(PaddingChar,L);
      return Result;
    };
    this.QuotedString = function () {
      var Result = "";
      Result = $mod.QuotedStr(this.get(),"'");
      return Result;
    };
    this.QuotedString$1 = function (AQuoteChar) {
      var Result = "";
      Result = $mod.QuotedStr(this.get(),AQuoteChar);
      return Result;
    };
    this.Remove = function (StartIndex) {
      var Result = "";
      Result = $mod.TStringHelper.Remove$1.call(this,StartIndex,$mod.TStringHelper.GetLength.call(this) - StartIndex);
      return Result;
    };
    this.Remove$1 = function (StartIndex, ACount) {
      var Result = "";
      Result = this.get();
      pas.System.Delete({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},StartIndex + 1,ACount);
      return Result;
    };
    this.Replace = function (OldChar, NewChar) {
      var Result = "";
      Result = $mod.TStringHelper.Replace$1.call(this,OldChar,NewChar,rtl.createSet($mod.TStringReplaceFlag.rfReplaceAll));
      return Result;
    };
    this.Replace$1 = function (OldChar, NewChar, ReplaceFlags) {
      var Result = "";
      Result = $mod.StringReplace(this.get(),OldChar,NewChar,rtl.refSet(ReplaceFlags));
      return Result;
    };
    this.Replace$2 = function (OldValue, NewValue) {
      var Result = "";
      Result = $mod.TStringHelper.Replace$3.call(this,OldValue,NewValue,rtl.createSet($mod.TStringReplaceFlag.rfReplaceAll));
      return Result;
    };
    this.Replace$3 = function (OldValue, NewValue, ReplaceFlags) {
      var Result = "";
      Result = $mod.StringReplace(this.get(),OldValue,NewValue,rtl.refSet(ReplaceFlags));
      return Result;
    };
    this.Split = function (Separators) {
      var Result = [];
      Result = $mod.TStringHelper.Split$1.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}));
      return Result;
    };
    this.Split$1 = function (Separators) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,Separators,"\x00","\x00",$mod.TStringHelper.GetLength.call(this) + 1,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$2 = function (Separators, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$3.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),ACount);
      return Result;
    };
    this.Split$3 = function (Separators, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,Separators,"\x00","\x00",ACount,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$4 = function (Separators, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$5.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),Options);
      return Result;
    };
    this.Split$5 = function (Separators, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$7.call(this,Separators,$mod.TStringHelper.GetLength.call(this) + 1,Options);
      return Result;
    };
    this.Split$6 = function (Separators, ACount, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$7.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),ACount,Options);
      return Result;
    };
    this.Split$7 = function (Separators, ACount, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,Separators,"\x00","\x00",ACount,Options);
      return Result;
    };
    this.Split$8 = function (Separators) {
      var Result = [];
      Result = $mod.TStringHelper.Split$9.call(this,Separators,$mod.TStringHelper.GetLength.call(this) + 1);
      return Result;
    };
    this.Split$9 = function (Separators, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$11.call(this,Separators,ACount,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$10 = function (Separators, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$11.call(this,Separators,$mod.TStringHelper.GetLength.call(this) + 1,Options);
      return Result;
    };
    this.Split$11 = function (Separators, ACount, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$26.call(this,Separators,"\x00","\x00",ACount,Options);
      return Result;
    };
    this.Split$12 = function (Separators, AQuote) {
      var Result = [];
      Result = $mod.TStringHelper.Split$13.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),AQuote);
      return Result;
    };
    this.Split$13 = function (Separators, AQuote) {
      var Result = [];
      Result = $mod.TStringHelper.Split$15.call(this,Separators,AQuote,AQuote);
      return Result;
    };
    this.Split$14 = function (Separators, AQuoteStart, AQuoteEnd) {
      var Result = [];
      Result = $mod.TStringHelper.Split$15.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),AQuoteStart,AQuoteEnd);
      return Result;
    };
    this.Split$15 = function (Separators, AQuoteStart, AQuoteEnd) {
      var Result = [];
      Result = $mod.TStringHelper.Split$17.call(this,Separators,AQuoteStart,AQuoteEnd,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$16 = function (Separators, AQuoteStart, AQuoteEnd, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$17.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),AQuoteStart,AQuoteEnd,Options);
      return Result;
    };
    this.Split$17 = function (Separators, AQuoteStart, AQuoteEnd, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,Separators,AQuoteStart,AQuoteEnd,$mod.TStringHelper.GetLength.call(this) + 1,Options);
      return Result;
    };
    this.Split$18 = function (Separators, AQuoteStart, AQuoteEnd, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$19.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),AQuoteStart,AQuoteEnd,ACount);
      return Result;
    };
    this.Split$19 = function (Separators, AQuoteStart, AQuoteEnd, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,Separators,AQuoteStart,AQuoteEnd,ACount,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$20 = function (Separators, AQuoteStart, AQuoteEnd, ACount, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$21.call(this,$mod.TStringHelper.ToCharArray$1.call({get: function () {
          return Separators;
        }, set: function (v) {
          rtl.raiseE("EPropReadOnly");
        }}),AQuoteStart,AQuoteEnd,ACount,Options);
      return Result;
    };
    var BlockSize = 10;
    this.Split$21 = function (Separators, AQuoteStart, AQuoteEnd, ACount, Options) {
      var $Self = this;
      var Result = [];
      var S = "";
      function NextSep(StartIndex) {
        var Result = 0;
        if (AQuoteStart !== "\x00") {
          Result = $mod.TStringHelper.IndexOfAnyUnquoted$1.call({get: function () {
              return S;
            }, set: function (v) {
              S = v;
            }},Separators,AQuoteStart,AQuoteEnd,StartIndex)}
         else Result = $mod.TStringHelper.IndexOfAny$3.call({get: function () {
            return S;
          }, set: function (v) {
            S = v;
          }},Separators,StartIndex);
        return Result;
      };
      function MaybeGrow(Curlen) {
        if (rtl.length(Result) <= Curlen) Result = rtl.arraySetLength(Result,"",rtl.length(Result) + 10);
      };
      var Sep = 0;
      var LastSep = 0;
      var Len = 0;
      var T = "";
      S = $Self.get();
      Result = rtl.arraySetLength(Result,"",10);
      Len = 0;
      LastSep = 0;
      Sep = NextSep(0);
      while ((Sep !== -1) && ((ACount === 0) || (Len < ACount))) {
        T = $mod.TStringHelper.Substring$1.call($Self,LastSep,Sep - LastSep);
        if ((T !== "") || !($mod.TStringSplitOptions.ExcludeEmpty === Options)) {
          MaybeGrow(Len);
          Result[Len] = T;
          Len += 1;
        };
        LastSep = Sep + 1;
        Sep = NextSep(LastSep);
      };
      if ((LastSep <= $mod.TStringHelper.GetLength.call($Self)) && ((ACount === 0) || (Len < ACount))) {
        T = $mod.TStringHelper.Substring.call($Self,LastSep);
        if ((T !== "") || !($mod.TStringSplitOptions.ExcludeEmpty === Options)) {
          MaybeGrow(Len);
          Result[Len] = T;
          Len += 1;
        };
      };
      Result = rtl.arraySetLength(Result,"",Len);
      return Result;
    };
    this.Split$22 = function (Separators, AQuote) {
      var Result = [];
      Result = $mod.TStringHelper.Split$23.call(this,Separators,AQuote,AQuote);
      return Result;
    };
    this.Split$23 = function (Separators, AQuoteStart, AQuoteEnd) {
      var Result = [];
      Result = $mod.TStringHelper.Split$26.call(this,Separators,AQuoteStart,AQuoteEnd,$mod.TStringHelper.GetLength.call(this) + 1,$mod.TStringSplitOptions.None);
      return Result;
    };
    this.Split$24 = function (Separators, AQuoteStart, AQuoteEnd, Options) {
      var Result = [];
      Result = $mod.TStringHelper.Split$26.call(this,Separators,AQuoteStart,AQuoteEnd,$mod.TStringHelper.GetLength.call(this) + 1,Options);
      return Result;
    };
    this.Split$25 = function (Separators, AQuoteStart, AQuoteEnd, ACount) {
      var Result = [];
      Result = $mod.TStringHelper.Split$26.call(this,Separators,AQuoteStart,AQuoteEnd,ACount,$mod.TStringSplitOptions.None);
      return Result;
    };
    var BlockSize$1 = 10;
    this.Split$26 = function (Separators, AQuoteStart, AQuoteEnd, ACount, Options) {
      var $Self = this;
      var Result = [];
      var S = "";
      function NextSep(StartIndex, Match) {
        var Result = 0;
        if (AQuoteStart !== "\x00") {
          Result = $mod.TStringHelper.IndexOfAnyUnquoted$3.call({get: function () {
              return S;
            }, set: function (v) {
              S = v;
            }},Separators,AQuoteStart,AQuoteEnd,StartIndex,Match)}
         else Result = $mod.TStringHelper.IndexOfAny$9.call({get: function () {
            return S;
          }, set: function (v) {
            S = v;
          }},Separators,StartIndex,$mod.TStringHelper.GetLength.call($Self),Match);
        return Result;
      };
      function MaybeGrow(Curlen) {
        if (rtl.length(Result) <= Curlen) Result = rtl.arraySetLength(Result,"",rtl.length(Result) + 10);
      };
      var Sep = 0;
      var LastSep = 0;
      var Len = 0;
      var Match = 0;
      var T = "";
      S = $Self.get();
      Result = rtl.arraySetLength(Result,"",10);
      Len = 0;
      LastSep = 0;
      Sep = NextSep(0,{get: function () {
          return Match;
        }, set: function (v) {
          Match = v;
        }});
      while ((Sep !== -1) && ((ACount === 0) || (Len < ACount))) {
        T = $mod.TStringHelper.Substring$1.call($Self,LastSep,Sep - LastSep);
        if ((T !== "") || !($mod.TStringSplitOptions.ExcludeEmpty === Options)) {
          MaybeGrow(Len);
          Result[Len] = T;
          Len += 1;
        };
        LastSep = Sep + Separators[Match].length;
        Sep = NextSep(LastSep,{get: function () {
            return Match;
          }, set: function (v) {
            Match = v;
          }});
      };
      if ((LastSep <= $mod.TStringHelper.GetLength.call($Self)) && ((ACount === 0) || (Len < ACount))) {
        T = $mod.TStringHelper.Substring.call($Self,LastSep);
        if ((T !== "") || !($mod.TStringSplitOptions.ExcludeEmpty === Options)) {
          MaybeGrow(Len);
          Result[Len] = T;
          Len += 1;
        };
      };
      Result = rtl.arraySetLength(Result,"",Len);
      return Result;
    };
    this.StartsWith = function (AValue) {
      var Result = false;
      Result = $mod.TStringHelper.StartsWith$1.call(this,AValue,false);
      return Result;
    };
    this.StartsWith$1 = function (AValue, IgnoreCase) {
      var Result = false;
      var L = 0;
      var S = "";
      L = AValue.length;
      Result = L <= 0;
      if (!Result) {
        S = pas.System.Copy(this.get(),1,L);
        Result = S.length === L;
        if (Result) if (IgnoreCase) {
          Result = $mod.SameText(S,AValue)}
         else Result = $mod.SameStr(S,AValue);
      };
      return Result;
    };
    this.Substring = function (AStartIndex) {
      var Result = "";
      Result = $mod.TStringHelper.Substring$1.call(this,AStartIndex,$mod.TStringHelper.GetLength.call(this) - AStartIndex);
      return Result;
    };
    this.Substring$1 = function (AStartIndex, ALen) {
      var Result = "";
      Result = pas.System.Copy(this.get(),AStartIndex + 1,ALen);
      return Result;
    };
    this.ToBoolean$1 = function () {
      var Result = false;
      Result = $mod.StrToBool(this.get());
      return Result;
    };
    this.ToInteger$1 = function () {
      var Result = 0;
      Result = $mod.StrToInt(this.get());
      return Result;
    };
    this.ToNativeInt$1 = function () {
      var Result = 0;
      Result = $mod.StrToNativeInt(this.get());
      return Result;
    };
    this.ToDouble$1 = function () {
      var Result = 0.0;
      Result = $mod.StrToFloat(this.get());
      return Result;
    };
    this.ToExtended$1 = function () {
      var Result = 0.0;
      Result = $mod.StrToFloat(this.get());
      return Result;
    };
    this.ToCharArray$1 = function () {
      var Result = [];
      Result = $mod.TStringHelper.ToCharArray$2.call(this,0,$mod.TStringHelper.GetLength.call(this));
      return Result;
    };
    this.ToCharArray$2 = function (AStartIndex, ALen) {
      var Result = [];
      var I = 0;
      Result = rtl.arraySetLength(Result,"\x00",ALen);
      for (var $l = 0, $end = ALen - 1; $l <= $end; $l++) {
        I = $l;
        Result[I] = this.get().charAt((AStartIndex + I + 1) - 1);
      };
      return Result;
    };
    this.ToLower = function () {
      var Result = "";
      Result = $mod.TStringHelper.LowerCase(this.get());
      return Result;
    };
    this.ToLowerInvariant = function () {
      var Result = "";
      Result = $mod.TStringHelper.LowerCase(this.get());
      return Result;
    };
    this.ToUpper = function () {
      var Result = "";
      Result = $mod.TStringHelper.UpperCase(this.get());
      return Result;
    };
    this.ToUpperInvariant = function () {
      var Result = "";
      Result = $mod.TStringHelper.UpperCase(this.get());
      return Result;
    };
    this.Trim = function () {
      var Result = "";
      Result = $mod.Trim(this.get());
      return Result;
    };
    this.TrimLeft = function () {
      var Result = "";
      Result = $mod.TrimLeft(this.get());
      return Result;
    };
    this.TrimRight = function () {
      var Result = "";
      Result = $mod.TrimRight(this.get());
      return Result;
    };
    this.Trim$1 = function (ATrimChars) {
      var Result = "";
      Result = $mod.TStringHelper.TrimRight$1.call({a: $mod.TStringHelper.TrimLeft$1.call(this,ATrimChars), get: function () {
          return this.a;
        }, set: function (v) {
          this.a = v;
        }},ATrimChars);
      return Result;
    };
    this.TrimLeft$1 = function (ATrimChars) {
      var Result = "";
      var I = 0;
      var Len = 0;
      I = 1;
      Len = $mod.TStringHelper.GetLength.call(this);
      while ((I <= Len) && $impl.HaveChar(this.get().charAt(I - 1),ATrimChars)) I += 1;
      if (I === 1) {
        Result = this.get()}
       else if (I > Len) {
        Result = ""}
       else Result = pas.System.Copy(this.get(),I,(Len - I) + 1);
      return Result;
    };
    this.TrimRight$1 = function (ATrimChars) {
      var Result = "";
      var I = 0;
      var Len = 0;
      Len = $mod.TStringHelper.GetLength.call(this);
      I = Len;
      while ((I >= 1) && $impl.HaveChar(this.get().charAt(I - 1),ATrimChars)) I -= 1;
      if (I < 1) {
        Result = ""}
       else if (I === Len) {
        Result = this.get()}
       else Result = pas.System.Copy(this.get(),1,I);
      return Result;
    };
    this.TrimEnd = function (ATrimChars) {
      var Result = "";
      Result = $mod.TStringHelper.TrimRight$1.call(this,ATrimChars);
      return Result;
    };
    this.TrimStart = function (ATrimChars) {
      var Result = "";
      Result = $mod.TStringHelper.TrimLeft$1.call(this,ATrimChars);
      return Result;
    };
  });
  rtl.createHelper(this,"TDoubleHelper",null,function () {
    this.Epsilon = 4.9406564584124654418e-324;
    this.MaxValue = 1.7976931348623157081e+308;
    this.MinValue = -1.7976931348623157081e+308;
    this.GetB = function (AIndex) {
      var Result = 0;
      var F = null;
      var B = null;
      F = new Float64Array(1);
      B = new Uint8Array(F.buffer);
      F[0] = this.get();
      Result = B[AIndex];
      return Result;
    };
    this.GetW = function (AIndex) {
      var Result = 0;
      var F = null;
      var W = null;
      F = new Float64Array(1);
      W = new Uint16Array(F.buffer);
      F[0] = this.get();
      Result = W[AIndex];
      return Result;
    };
    this.GetE = function () {
      var Result = 0;
      Result = $impl.FloatToParts(this.get()).exp;
      return Result;
    };
    this.GetF = function () {
      var Result = 0;
      Result = 0;
      $impl.NotImplemented("GetF");
      return Result;
    };
    this.GetS = function () {
      var Result = false;
      Result = $impl.FloatToParts(this.get()).sign;
      return Result;
    };
    this.SetS = function (aValue) {
      var F = null;
      var B = null;
      F = new Float64Array(1);
      B = new Uint8Array(F.buffer);
      F[0] = this.get();
      if (aValue) {
        B[7] = B[7] | (1 >>> 7)}
       else B[7] = B[7] & ~(1 >>> 7);
      this.set(F[0]);
    };
    this.SetB = function (AIndex, AValue) {
      var F = null;
      var B = null;
      if (AIndex >= 8) throw $mod.ERangeError.$create("Create$1",[rtl.getResStr(pas.RTLConsts,"SRangeError")]);
      F = new Float64Array(1);
      B = new Uint8Array(F.buffer);
      F[0] = this.get();
      B[AIndex] = AValue;
      this.set(F[0]);
    };
    this.SetW = function (AIndex, AValue) {
      var F = null;
      var W = null;
      if (AIndex >= 4) throw $mod.ERangeError.$create("Create$1",[rtl.getResStr(pas.RTLConsts,"SRangeError")]);
      F = new Float64Array(1);
      W = new Uint16Array(F.buffer);
      F[0] = this.get();
      W[AIndex] = AValue;
      this.set(F[0]);
    };
    this.IsInfinity = function (AValue) {
      var Result = false;
      Result = !isFinite(AValue);
      return Result;
    };
    this.IsNan = function (AValue) {
      var Result = false;
      Result = isNaN(AValue);
      return Result;
    };
    this.IsNegativeInfinity = function (AValue) {
      var Result = false;
      return (AValue=Number.NEGATIVE_INFINITY);
      Result = AValue === 0;
      return Result;
    };
    this.IsPositiveInfinity = function (AValue) {
      var Result = false;
      return (AValue=Number.POSITIVE_INFINITY);
      Result = AValue === 0;
      return Result;
    };
    this.Parse = function (AString) {
      var Result = 0.0;
      Result = $mod.StrToFloat(AString);
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.FloatToStr(AValue);
      return Result;
    };
    this.ToString$1 = function (AValue, AFormat, APrecision, ADigits) {
      var Result = "";
      Result = $mod.FloatToStrF(AValue,AFormat,APrecision,ADigits);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      Result = $mod.TryStrToFloat$2(AString,AValue);
      return Result;
    };
    this.BuildUp = function (ASignFlag, AMantissa, AExponent) {
      $impl.NotImplemented("BuildUp");
      if (ASignFlag && (AMantissa > 0) && (AExponent < 0)) return;
    };
    this.Exponent = function () {
      var Result = 0;
      Result = $impl.FloatToParts(this.get()).exp;
      return Result;
    };
    this.Fraction = function () {
      var Result = 0.0;
      Result = pas.System.Frac(this.get());
      return Result;
    };
    this.IsInfinity$1 = function () {
      var Result = false;
      Result = $mod.TDoubleHelper.IsInfinity(this.get());
      return Result;
    };
    this.IsNan$1 = function () {
      var Result = false;
      Result = $mod.TDoubleHelper.IsNan(this.get());
      return Result;
    };
    this.IsNegativeInfinity$1 = function () {
      var Result = false;
      Result = $mod.TDoubleHelper.IsNegativeInfinity(this.get());
      return Result;
    };
    this.IsPositiveInfinity$1 = function () {
      var Result = false;
      Result = $mod.TDoubleHelper.IsPositiveInfinity(this.get());
      return Result;
    };
    this.Mantissa = function () {
      var Result = 0;
      Result = pas.System.Trunc($impl.FloatToParts(this.get()).mantissa);
      return Result;
    };
    this.ToString$2 = function (AFormat, APrecision, ADigits) {
      var Result = "";
      Result = $mod.FloatToStrF(this.get(),AFormat,APrecision,ADigits);
      return Result;
    };
    this.ToString$3 = function () {
      var Result = "";
      Result = $mod.FloatToStr(this.get());
      return Result;
    };
  });
  rtl.createHelper(this,"TByteHelper",null,function () {
    this.MaxValue = 255;
    this.MinValue = 0;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 1;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$3(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TByteHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      Result = $mod.IntToHex(this.get(),AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.IntToHex(this.get(),$mod.TByteHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(this.get() | (1 << Index));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(this.get() & ~(1 << Index));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(this.get() ^ (1 << Index));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = (this.get() & (1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TShortIntHelper",null,function () {
    this.MaxValue = 127;
    this.MinValue = -128;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 1;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$2(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TShortIntHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      var B = 0;
      var U = null;
      var S = null;
      if (this.get() >= 0) {
        B = this.get()}
       else {
        S = new Int8Array(1);
        S[0] = this.get();
        U = new Uint8Array(S);
        B = U[0];
        if (AMinDigits > 2) B = 0xFF00 + B;
      };
      Result = $mod.IntToHex(B,AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.TShortIntHelper.ToHexString.call(this,$mod.TShortIntHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(this.get() | (1 << Index));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(this.get() & ~(1 << Index));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(this.get() ^ (1 << Index));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = (this.get() & (1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TSmallIntHelper",null,function () {
    this.MaxValue = 32767;
    this.MinValue = -32768;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 2;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$4(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TSmallIntHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function () {
      var Result = "";
      Result = $mod.TSmallIntHelper.ToHexString$1.call(this,$mod.TSmallIntHelper.Size() * 2);
      return Result;
    };
    this.ToHexString$1 = function (AMinDigits) {
      var Result = "";
      var B = 0;
      var U = null;
      var S = null;
      if (this.get() >= 0) {
        B = this.get()}
       else {
        S = new Int16Array(1);
        S[0] = this.get();
        U = new Uint16Array(S);
        B = U[0];
        if (AMinDigits > 6) {
          B = 0xFFFF0000 + B}
         else if (AMinDigits > 4) B = 0xFF0000 + B;
      };
      Result = $mod.IntToHex(B,AMinDigits);
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(this.get() | (1 << Index));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(this.get() & ~(1 << Index));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(this.get() ^ (1 << Index));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = (this.get() & (1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TWordHelper",null,function () {
    this.MaxValue = 65535;
    this.MinValue = 0;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 2;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$5(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TWordHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      Result = $mod.IntToHex(this.get(),AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.IntToHex(this.get(),$mod.TWordHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(this.get() | (1 << Index));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(this.get() & ~(1 << Index));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(this.get() ^ (1 << Index));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = (this.get() & (1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TCardinalHelper",null,function () {
    this.MaxValue = 4294967295;
    this.MinValue = 0;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 4;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$7(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TCardinalHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      Result = $mod.IntToHex(this.get(),AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.TCardinalHelper.ToHexString.call(this,$mod.TCardinalHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(rtl.lw(this.get() | rtl.lw(1 << Index)));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(rtl.lw(this.get() & rtl.lw(~rtl.lw(1 << Index))));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(rtl.lw(this.get() ^ rtl.lw(1 << Index)));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = rtl.lw(this.get() & rtl.lw(1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TIntegerHelper",null,function () {
    this.MaxValue = 2147483647;
    this.MinValue = -2147483648;
    this.Size = function () {
      var Result = 0;
      Result = 4;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$6(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TIntegerHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      var B = 0;
      var U = null;
      var S = null;
      if (this.get() >= 0) {
        B = this.get()}
       else {
        S = new Int32Array(1);
        S[0] = this.get();
        U = new Uint32Array(S);
        B = U[0];
      };
      Result = $mod.IntToHex(B,AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.TIntegerHelper.ToHexString.call(this,$mod.TIntegerHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(this.get() | (1 << Index));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(this.get() & ~(1 << Index));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(this.get() ^ (1 << Index));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = (this.get() & (1 << Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TNativeIntHelper",null,function () {
    this.MaxValue = 9007199254740991;
    this.MinValue = -9007199254740991;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 7;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TNativeIntHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      Result = $mod.IntToHex(this.get(),AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.IntToHex(this.get(),$mod.TNativeIntHelper.Size() * 2);
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(rtl.or(this.get(),rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(rtl.and(this.get(),~rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(rtl.xor(this.get(),rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = rtl.and(this.get(),rtl.shl(1,Index)) !== 0;
      return Result;
    };
  });
  rtl.createHelper(this,"TNativeUIntHelper",null,function () {
    this.MaxValue = 9007199254740991;
    this.MinValue = 0;
    this.Parse = function (AString) {
      var Result = 0;
      Result = $mod.StrToInt(AString);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 7;
      return Result;
    };
    this.ToString = function (AValue) {
      var Result = "";
      Result = $mod.IntToStr(AValue);
      return Result;
    };
    this.TryParse = function (AString, AValue) {
      var Result = false;
      var C = 0;
      pas.System.val$1(AString,AValue,{get: function () {
          return C;
        }, set: function (v) {
          C = v;
        }});
      Result = C === 0;
      return Result;
    };
    this.ToBoolean = function () {
      var Result = false;
      Result = this.get() !== 0;
      return Result;
    };
    this.ToDouble = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToExtended = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToBinString = function () {
      var Result = "";
      Result = pas.System.binstr(this.get(),$mod.TNativeUIntHelper.Size() * 8);
      return Result;
    };
    this.ToHexString = function (AMinDigits) {
      var Result = "";
      Result = $mod.IntToHex(this.get(),AMinDigits);
      return Result;
    };
    this.ToHexString$1 = function () {
      var Result = "";
      Result = $mod.IntToHex(this.get(),$mod.TNativeUIntHelper.Size() * 2);
      return Result;
    };
    this.ToSingle = function () {
      var Result = 0.0;
      Result = this.get();
      return Result;
    };
    this.ToString$1 = function () {
      var Result = "";
      Result = $mod.IntToStr(this.get());
      return Result;
    };
    this.SetBit = function (Index) {
      var Result = 0;
      this.set(rtl.or(this.get(),rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.ClearBit = function (Index) {
      var Result = 0;
      this.set(rtl.and(this.get(),~rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.ToggleBit = function (Index) {
      var Result = 0;
      this.set(rtl.xor(this.get(),rtl.shl(1,Index)));
      Result = this.get();
      return Result;
    };
    this.TestBit = function (Index) {
      var Result = false;
      Result = rtl.and(this.get(),rtl.shl(1,Index)) !== 0;
      return Result;
    };
  });
  this.TUseBoolStrs = {"0": "False", False: 0, "1": "True", True: 1};
  this.$rtti.$Enum("TUseBoolStrs",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.TUseBoolStrs});
  rtl.createHelper(this,"TBooleanHelper",null,function () {
    this.Parse = function (S) {
      var Result = false;
      Result = $mod.StrToBool(S);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 1;
      return Result;
    };
    this.ToString = function (AValue, UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(AValue,UseBoolStrs === $mod.TUseBoolStrs.True);
      return Result;
    };
    this.TryToParse = function (S, AValue) {
      var Result = false;
      Result = $mod.TryStrToBool(S,AValue);
      return Result;
    };
    this.ToInteger = function () {
      var Result = 0;
      Result = (this.get() ? 1 : 0);
      return Result;
    };
    this.ToString$1 = function (UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(this.get(),UseBoolStrs === $mod.TUseBoolStrs.True);
      return Result;
    };
  });
  rtl.createHelper(this,"TByteBoolHelper",null,function () {
    this.Parse = function (S) {
      var Result = false;
      Result = $mod.StrToBool(S);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 1;
      return Result;
    };
    this.ToString = function (AValue, UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(AValue,UseBoolStrs);
      return Result;
    };
    this.TryToParse = function (S, AValue) {
      var Result = false;
      Result = $mod.TryStrToBool(S,AValue);
      return Result;
    };
    this.ToInteger = function () {
      var Result = 0;
      Result = (this.get() ? 1 : 0);
      return Result;
    };
    this.ToString$1 = function (UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(this.get(),UseBoolStrs);
      return Result;
    };
  });
  rtl.createHelper(this,"TWordBoolHelper",null,function () {
    this.Parse = function (S) {
      var Result = false;
      Result = $mod.StrToBool(S);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 2;
      return Result;
    };
    this.ToString = function (AValue, UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(AValue,UseBoolStrs);
      return Result;
    };
    this.TryToParse = function (S, AValue) {
      var Result = false;
      Result = $mod.TryStrToBool(S,AValue);
      return Result;
    };
    this.ToInteger = function () {
      var Result = 0;
      Result = (this.get() ? 1 : 0);
      return Result;
    };
    this.ToString$1 = function (UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(this.get(),UseBoolStrs);
      return Result;
    };
  });
  rtl.createHelper(this,"TLongBoolHelper",null,function () {
    this.Parse = function (S) {
      var Result = false;
      Result = $mod.StrToBool(S);
      return Result;
    };
    this.Size = function () {
      var Result = 0;
      Result = 4;
      return Result;
    };
    this.ToString = function (AValue, UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(AValue,UseBoolStrs);
      return Result;
    };
    this.TryToParse = function (S, AValue) {
      var Result = false;
      Result = $mod.TryStrToBool(S,AValue);
      return Result;
    };
    this.ToInteger = function () {
      var Result = 0;
      Result = (this.get() ? 1 : 0);
      return Result;
    };
    this.ToString$1 = function (UseBoolStrs) {
      var Result = "";
      Result = $mod.BoolToStr(this.get(),UseBoolStrs);
      return Result;
    };
  });
  rtl.createClass(this,"TStringBuilder",pas.System.TObject,function () {
    this.DefaultCapacity = 64;
    this.$init = function () {
      pas.System.TObject.$init.call(this);
      this.FData = "";
      this.FMaxCapacity = 0;
    };
    this.GetCapacity = function () {
      var Result = 0;
      Result = this.FData.length;
      return Result;
    };
    this.SetCapacity = function (AValue) {
      if (AValue > this.FMaxCapacity) throw $mod.ERangeError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SListCapacityError"),pas.System.VarRecs(0,AValue)]);
      if (AValue < this.GetLength()) throw $mod.ERangeError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SListCapacityError"),pas.System.VarRecs(0,AValue)]);
    };
    this.GetC = function (Index) {
      var Result = "\x00";
      this.CheckNegative(Index,"Index");
      this.CheckRange(Index,0,this.GetLength());
      Result = this.FData.charAt(Index - 1);
      return Result;
    };
    this.SetC = function (Index, AValue) {
      this.CheckNegative(Index,"Index");
      this.CheckRange(Index,0,this.GetLength() - 1);
      this.FData = rtl.setCharAt(this.FData,Index - 1,AValue);
    };
    this.GetLength = function () {
      var Result = 0;
      Result = this.FData.length;
      return Result;
    };
    this.SetLength = function (AValue) {
      this.CheckNegative(AValue,"AValue");
      this.CheckRange(AValue,0,this.FMaxCapacity);
      this.FData = rtl.strSetLength(this.FData,AValue);
    };
    this.CheckRange = function (Idx, Count, MaxLen) {
      if ((Idx < 0) || ((Idx + Count) > MaxLen)) throw $mod.ERangeError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SListIndexError"),pas.System.VarRecs(0,Idx)]);
    };
    this.CheckNegative = function (AValue, AName) {
      if (AValue < 0) throw $mod.ERangeError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SParamIsNegative"),pas.System.VarRecs(18,AName)]);
    };
    this.DoAppend = function (S) {
      this.FData = this.FData + S;
    };
    this.DoAppend$1 = function (AValue, Idx, aCount) {
      var S = "";
      var I = 0;
      S = "";
      this.CheckRange(Idx,aCount,rtl.length(AValue));
      for (var $l = Idx, $end = (Idx + aCount) - 1; $l <= $end; $l++) {
        I = $l;
        S = S + AValue[I];
      };
      this.DoAppend(S);
    };
    this.DoInsert = function (Index, AValue) {
      this.CheckRange(Index,0,this.GetLength() - 1);
      pas.System.Insert(AValue,{p: this, get: function () {
          return this.p.FData;
        }, set: function (v) {
          this.p.FData = v;
        }},Index + 1);
    };
    this.DoInsert$1 = function (Index, AValue, StartIndex, aCharCount) {
      var I = 0;
      var S = "";
      this.CheckRange(Index,0,this.GetLength() - 1);
      this.CheckNegative(StartIndex,"StartIndex");
      this.CheckNegative(aCharCount,"SBCharCount");
      this.CheckRange(StartIndex,aCharCount,rtl.length(AValue));
      S = "";
      for (var $l = StartIndex, $end = (StartIndex + aCharCount) - 1; $l <= $end; $l++) {
        I = $l;
        S = S + AValue[I];
      };
      this.DoInsert(Index,S);
    };
    this.DoReplace = function (Index, Old, New) {
      var OVLen = 0;
      OVLen = Old.length;
      pas.System.Delete({p: this, get: function () {
          return this.p.FData;
        }, set: function (v) {
          this.p.FData = v;
        }},Index + 1,OVLen);
      pas.System.Insert(New,{p: this, get: function () {
          return this.p.FData;
        }, set: function (v) {
          this.p.FData = v;
        }},Index + 1);
    };
    this.Grow = function () {
      var NewCapacity = 0;
      NewCapacity = this.GetCapacity() * 2;
      if (NewCapacity > this.FMaxCapacity) NewCapacity = this.FMaxCapacity;
      this.SetCapacity(NewCapacity);
    };
    this.Shrink = function () {
      if (rtl.trunc(this.GetCapacity() / 4) >= this.GetLength()) this.SetCapacity(rtl.trunc(this.GetCapacity() / 2));
    };
    this.Create$1 = function () {
      this.Create$4(64,2147483647);
      return this;
    };
    this.Create$2 = function (aCapacity) {
      this.Create$4(aCapacity,2147483647);
      return this;
    };
    this.Create$3 = function (AValue) {
      this.Create$5(AValue,64);
      return this;
    };
    this.Create$4 = function (aCapacity, aMaxCapacity) {
      this.FMaxCapacity = aMaxCapacity;
      this.SetCapacity(aCapacity);
      return this;
    };
    this.Create$5 = function (AValue, aCapacity) {
      this.Create$4(aCapacity,2147483647);
      if (AValue.length > 0) this.Append$15(AValue);
      return this;
    };
    this.Create$6 = function (AValue, StartIndex, aLength, aCapacity) {
      this.Create$5(pas.System.Copy(AValue,StartIndex + 1,aLength),aCapacity);
      return this;
    };
    this.Append = function (AValue) {
      var Result = null;
      this.DoAppend($mod.BoolToStr(AValue,true));
      Result = this;
      return Result;
    };
    this.Append$1 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$2 = function (AValue) {
      var Result = null;
      this.DoAppend(AValue);
      Result = this;
      return Result;
    };
    this.Append$3 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.CurrToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$4 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.FloatToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$5 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$6 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$7 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$8 = function (AValue) {
      var Result = null;
      this.DoAppend(AValue.ToString());
      Result = this;
      return Result;
    };
    this.Append$9 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$10 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.FloatToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$11 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$12 = function (AValue) {
      var Result = null;
      var I = 0;
      var L = 0;
      I = -1;
      L = rtl.length(AValue);
      if (L === 0) return this;
      do {
        I += 1;
      } while (!((I >= L) || (AValue[I] === "\x00")));
      this.DoAppend$1(AValue,0,I);
      Result = this;
      return Result;
    };
    this.Append$13 = function (AValue) {
      var Result = null;
      this.Append$15($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$14 = function (AValue) {
      var Result = null;
      this.DoAppend($mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Append$15 = function (AValue) {
      var Result = null;
      this.DoAppend(AValue);
      Result = this;
      return Result;
    };
    this.Append$16 = function (AValue, RepeatCount) {
      var Result = null;
      this.DoAppend(pas.System.StringOfChar(AValue,RepeatCount));
      Result = this;
      return Result;
    };
    this.Append$17 = function (AValue, StartIndex, SBCharCount) {
      var Result = null;
      this.DoAppend$1(AValue,StartIndex,SBCharCount);
      Result = this;
      return Result;
    };
    this.Append$18 = function (AValue, StartIndex, Count) {
      var Result = null;
      this.CheckRange(StartIndex,Count,AValue.length);
      this.DoAppend(pas.System.Copy(AValue,StartIndex + 1,Count));
      Result = this;
      return Result;
    };
    this.Append$19 = function (Fmt, Args) {
      var Result = null;
      this.DoAppend($mod.Format(Fmt,Args));
      Result = this;
      return Result;
    };
    this.AppendFormat = function (Fmt, Args) {
      var Result = null;
      this.DoAppend($mod.Format(Fmt,Args));
      Result = this;
      return Result;
    };
    this.AppendLine = function () {
      var Result = null;
      this.DoAppend(pas.System.sLineBreak);
      Result = this;
      return Result;
    };
    this.AppendLine$1 = function (AValue) {
      var Result = null;
      this.DoAppend(AValue);
      Result = this.AppendLine();
      return Result;
    };
    this.Clear = function () {
      this.SetLength(0);
      this.SetCapacity(64);
    };
    this.CopyTo = function (SourceIndex, Destination, DestinationIndex, Count) {
      var I = 0;
      this.CheckNegative(Count,"Count");
      this.CheckNegative(DestinationIndex,"DestinationIndex");
      this.CheckRange(DestinationIndex,Count,rtl.length(Destination.get()));
      if (Count > 0) {
        this.CheckRange(SourceIndex,Count,this.GetLength());
        for (var $l = SourceIndex + 1, $end = SourceIndex + Count; $l <= $end; $l++) {
          I = $l;
          Destination.get()[DestinationIndex] = this.FData.charAt(I - 1);
        };
      };
    };
    this.EnsureCapacity = function (aCapacity) {
      var Result = 0;
      this.CheckRange(aCapacity,0,this.FMaxCapacity);
      if (this.GetCapacity() < aCapacity) this.SetCapacity(aCapacity);
      Result = this.GetCapacity();
      return Result;
    };
    this.Equals$1 = function (StringBuilder) {
      var Result = false;
      Result = StringBuilder !== null;
      if (Result) Result = (this.GetLength() === StringBuilder.GetLength()) && (this.FMaxCapacity === StringBuilder.FMaxCapacity) && (this.FData === StringBuilder.FData.charAt(-1));
      return Result;
    };
    this.Insert = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.BoolToStr(AValue,true));
      Result = this;
      return Result;
    };
    this.Insert$1 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$2 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,AValue);
      Result = this;
      return Result;
    };
    this.Insert$3 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.CurrToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$4 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.FloatToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$5 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$6 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$7 = function (Index, AValue) {
      var Result = null;
      this.DoInsert$1(Index,AValue,0,rtl.length(AValue));
      Result = this;
      return Result;
    };
    this.Insert$8 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$9 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,AValue.ToString());
      Result = this;
      return Result;
    };
    this.Insert$10 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$11 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.FloatToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$12 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,AValue);
      Result = this;
      return Result;
    };
    this.Insert$13 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$14 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$15 = function (Index, AValue) {
      var Result = null;
      this.DoInsert(Index,$mod.IntToStr(AValue));
      Result = this;
      return Result;
    };
    this.Insert$16 = function (Index, AValue, aRepeatCount) {
      var Result = null;
      var I = 0;
      for (var $l = 0, $end = aRepeatCount - 1; $l <= $end; $l++) {
        I = $l;
        this.DoInsert(Index,AValue);
      };
      Result = this;
      return Result;
    };
    this.Insert$17 = function (Index, AValue, startIndex, SBCharCount) {
      var Result = null;
      this.DoInsert$1(Index,AValue,startIndex,SBCharCount);
      Result = this;
      return Result;
    };
    this.Remove = function (StartIndex, RemLength) {
      var Result = null;
      var MoveIndex = 0;
      if (RemLength === 0) return this;
      this.CheckNegative(RemLength,"RemLength");
      this.CheckRange(StartIndex,0,this.GetLength());
      MoveIndex = StartIndex + RemLength;
      this.CheckRange(MoveIndex,0,this.GetLength());
      pas.System.Delete({p: this, get: function () {
          return this.p.FData;
        }, set: function (v) {
          this.p.FData = v;
        }},StartIndex + 1,RemLength);
      this.Shrink();
      Result = this;
      return Result;
    };
    this.Replace = function (OldValue, NewValue) {
      var Result = null;
      Result = this.Replace$1(OldValue,NewValue,0,this.GetLength());
      return Result;
    };
    this.Replace$1 = function (OldValue, NewValue, StartIndex, Count) {
      var Result = null;
      var I = 0;
      var Start = "";
      if (Count === 0) return this;
      this.CheckNegative(StartIndex,"StartIndex");
      this.CheckNegative(Count,"Count");
      this.CheckRange(StartIndex,Count,this.GetLength());
      Start = pas.System.Copy(this.FData,1,StartIndex + 1);
      this.FData = pas.System.Copy$1(this.FData,StartIndex + 1);
      for (var $l = 1, $end = Count; $l <= $end; $l++) {
        I = $l;
        this.FData = $mod.StringReplace(this.FData,OldValue,NewValue,{});
      };
      this.FData = Start + this.FData;
      Result = this;
      return Result;
    };
    this.ToString = function () {
      var Result = "";
      Result = this.ToString$2(0,this.GetLength());
      return Result;
    };
    this.ToString$2 = function (aStartIndex, aLength) {
      var Result = "";
      this.CheckNegative(aStartIndex,"aStartIndex");
      this.CheckNegative(aLength,"aLength");
      this.CheckRange(aStartIndex,aLength,this.GetLength());
      Result = pas.System.Copy(this.FData,1 + aStartIndex,aStartIndex + aLength);
      return Result;
    };
  });
  $mod.$implcode = function () {
    $impl.DefaultShortMonthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    $impl.DefaultLongMonthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    $impl.DefaultShortDayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    $impl.DefaultLongDayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    $impl.DoShowException = function (S) {
      if ($mod.OnShowException != null) {
        $mod.OnShowException(S)}
       else {
        window.alert(S);
      };
    };
    $mod.$rtti.$ProcVar("TRTLExceptionHandler",{procsig: rtl.newTIProcSig([["aError",rtl.jsvalue]])});
    $impl.OnPascalException = null;
    $impl.OnJSException = null;
    $impl.RTLExceptionHook = function (aError) {
      var S = "";
      if (pas.JS.isClassInstance(aError)) {
        if ($impl.OnPascalException != null) {
          $impl.OnPascalException(rtl.getObject(aError))}
         else $mod.ShowException(rtl.getObject(aError),null);
      } else if (rtl.isObject(aError)) {
        if ($impl.OnJSException != null) {
          $impl.OnJSException(aError)}
         else {
          if (aError.hasOwnProperty("message")) {
            S = rtl.getResStr($mod,"SErrUnknownExceptionType") + ("" + aError["message"])}
           else S = rtl.getResStr($mod,"SErrUnknownExceptionType") + aError.toString();
          $impl.DoShowException(S);
        };
      } else {
        S = rtl.getResStr($mod,"SErrUnknownExceptionType") + ("" + aError);
        $impl.DoShowException(S);
      };
    };
    $mod.$rtti.$Set("TCharSet",{comptype: rtl.char});
    $impl.CharInSet$1 = function (Ch, CSet) {
      var Result = false;
      Result = Ch.charCodeAt() in CSet;
      return Result;
    };
    $impl.CheckBoolStrs = function () {
      if (rtl.length($mod.TrueBoolStrs) === 0) {
        $mod.TrueBoolStrs = rtl.arraySetLength($mod.TrueBoolStrs,"",1);
        $mod.TrueBoolStrs[0] = "True";
      };
      if (rtl.length($mod.FalseBoolStrs) === 0) {
        $mod.FalseBoolStrs = rtl.arraySetLength($mod.FalseBoolStrs,"",1);
        $mod.FalseBoolStrs[0] = "False";
      };
    };
    $impl.feInvalidFormat = 1;
    $impl.feMissingArgument = 2;
    $impl.feInvalidArgIndex = 3;
    $impl.DoFormatError = function (ErrCode, fmt) {
      var $tmp = ErrCode;
      if ($tmp === 1) {
        throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidFormat"),pas.System.VarRecs(18,fmt)])}
       else if ($tmp === 2) {
        throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SArgumentMissing"),pas.System.VarRecs(18,fmt)])}
       else if ($tmp === 3) throw $mod.EConvertError.$create("CreateFmt",[rtl.getResStr(pas.RTLConsts,"SInvalidArgIndex"),pas.System.VarRecs(18,fmt)]);
    };
    $impl.maxdigits = 15;
    $impl.ReplaceDecimalSep = function (S, DS) {
      var Result = "";
      var P = 0;
      P = pas.System.Pos(".",S);
      if (P > 0) {
        Result = pas.System.Copy(S,1,P - 1) + DS + pas.System.Copy(S,P + 1,S.length - P)}
       else Result = S;
      return Result;
    };
    $impl.FormatGeneralFloat = function (Value, Precision, DS) {
      var Result = "";
      var P = 0;
      var PE = 0;
      var Q = 0;
      var Exponent = 0;
      if ((Precision === -1) || (Precision > 15)) Precision = 15;
      Result = rtl.floatToStr(Value,Precision + 7);
      Result = $mod.TrimLeft(Result);
      P = pas.System.Pos(".",Result);
      if (P === 0) return Result;
      PE = pas.System.Pos("E",Result);
      if (PE === 0) {
        Result = $impl.ReplaceDecimalSep(Result,DS);
        return Result;
      };
      Q = PE + 2;
      Exponent = 0;
      while (Q <= Result.length) {
        Exponent = ((Exponent * 10) + Result.charCodeAt(Q - 1)) - 48;
        Q += 1;
      };
      if (Result.charAt((PE + 1) - 1) === "-") Exponent = -Exponent;
      if (((P + Exponent) < PE) && (Exponent > -6)) {
        Result = rtl.strSetLength(Result,PE - 1);
        if (Exponent >= 0) {
          for (var $l = 0, $end = Exponent - 1; $l <= $end; $l++) {
            Q = $l;
            Result = rtl.setCharAt(Result,P - 1,Result.charAt((P + 1) - 1));
            P += 1;
          };
          Result = rtl.setCharAt(Result,P - 1,".");
          P = 1;
          if (Result.charAt(P - 1) === "-") P += 1;
          while ((Result.charAt(P - 1) === "0") && (P < Result.length) && (pas.System.Copy(Result,P + 1,DS.length) !== DS)) pas.System.Delete({get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},P,1);
        } else {
          pas.System.Insert(pas.System.Copy("00000",1,-Exponent),{get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},P - 1);
          Result = rtl.setCharAt(Result,P - Exponent - 1,Result.charAt(P - Exponent - 1 - 1));
          Result = rtl.setCharAt(Result,P - 1,".");
          if (Exponent !== -1) Result = rtl.setCharAt(Result,P - Exponent - 1 - 1,"0");
        };
        Q = Result.length;
        while ((Q > 0) && (Result.charAt(Q - 1) === "0")) Q -= 1;
        if (Result.charAt(Q - 1) === ".") Q -= 1;
        if ((Q === 0) || ((Q === 1) && (Result.charAt(0) === "-"))) {
          Result = "0"}
         else Result = rtl.strSetLength(Result,Q);
      } else {
        while (Result.charAt(PE - 1 - 1) === "0") {
          pas.System.Delete({get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},PE - 1,1);
          PE -= 1;
        };
        if (Result.charAt(PE - 1 - 1) === DS) {
          pas.System.Delete({get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},PE - 1,1);
          PE -= 1;
        };
        if (Result.charAt((PE + 1) - 1) === "+") {
          pas.System.Delete({get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},PE + 1,1)}
         else PE += 1;
        while (Result.charAt((PE + 1) - 1) === "0") pas.System.Delete({get: function () {
            return Result;
          }, set: function (v) {
            Result = v;
          }},PE + 1,1);
      };
      Result = $impl.ReplaceDecimalSep(Result,DS);
      return Result;
    };
    $impl.FormatExponentFloat = function (Value, Precision, Digits, DS) {
      var Result = "";
      var P = 0;
      DS = $mod.FormatSettings.DecimalSeparator;
      if ((Precision === -1) || (Precision > 15)) Precision = 15;
      Result = rtl.floatToStr(Value,Precision + 7);
      while (Result.charAt(0) === " ") pas.System.Delete({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},1,1);
      P = pas.System.Pos("E",Result);
      if (P === 0) {
        Result = $impl.ReplaceDecimalSep(Result,DS);
        return Result;
      };
      P += 2;
      if (Digits > 4) Digits = 4;
      Digits = (Result.length - P - Digits) + 1;
      if (Digits < 0) {
        pas.System.Insert(pas.System.Copy("0000",1,-Digits),{get: function () {
            return Result;
          }, set: function (v) {
            Result = v;
          }},P)}
       else while ((Digits > 0) && (Result.charAt(P - 1) === "0")) {
        pas.System.Delete({get: function () {
            return Result;
          }, set: function (v) {
            Result = v;
          }},P,1);
        if (P > Result.length) {
          pas.System.Delete({get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},P - 2,2);
          break;
        };
        Digits -= 1;
      };
      Result = $impl.ReplaceDecimalSep(Result,DS);
      return Result;
    };
    $impl.FormatFixedFloat = function (Value, Digits, DS) {
      var Result = "";
      if (Digits === -1) {
        Digits = 2}
       else if (Digits > 18) Digits = 18;
      Result = rtl.floatToStr(Value,0,Digits);
      if ((Result !== "") && (Result.charAt(0) === " ")) pas.System.Delete({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},1,1);
      Result = $impl.ReplaceDecimalSep(Result,DS);
      return Result;
    };
    $impl.FormatNumberFloat = function (Value, Digits, DS, TS) {
      var Result = "";
      var P = 0;
      if (Digits === -1) {
        Digits = 2}
       else if (Digits > 15) Digits = 15;
      Result = rtl.floatToStr(Value,0,Digits);
      if ((Result !== "") && (Result.charAt(0) === " ")) pas.System.Delete({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},1,1);
      P = pas.System.Pos(".",Result);
      if (P <= 0) P = Result.length + 1;
      Result = $impl.ReplaceDecimalSep(Result,DS);
      P -= 3;
      if ((TS !== "") && (TS !== "\x00")) while (P > 1) {
        if (Result.charAt(P - 1 - 1) !== "-") pas.System.Insert(TS,{get: function () {
            return Result;
          }, set: function (v) {
            Result = v;
          }},P);
        P -= 3;
      };
      return Result;
    };
    $impl.RemoveLeadingNegativeSign = function (AValue, DS, aThousandSeparator) {
      var Result = false;
      var i = 0;
      var TS = "";
      var StartPos = 0;
      Result = false;
      StartPos = 2;
      TS = aThousandSeparator;
      for (var $l = StartPos, $end = AValue.get().length; $l <= $end; $l++) {
        i = $l;
        Result = (AValue.get().charCodeAt(i - 1) in rtl.createSet(48,DS.charCodeAt(),69,43)) || (AValue.get().charAt(i - 1) === TS);
        if (!Result) break;
      };
      if (Result && (AValue.get().charAt(0) === "-")) pas.System.Delete(AValue,1,1);
      return Result;
    };
    $impl.FormatNumberCurrency = function (Value, Digits, aSettings) {
      var Result = "";
      var Negative = false;
      var P = 0;
      var CS = "";
      var DS = "";
      var TS = "";
      DS = aSettings.DecimalSeparator;
      TS = aSettings.ThousandSeparator;
      CS = aSettings.CurrencyString;
      if (Digits === -1) {
        Digits = aSettings.CurrencyDecimals}
       else if (Digits > 18) Digits = 18;
      Result = rtl.floatToStr(Value / 10000,0,Digits);
      Negative = Result.charAt(0) === "-";
      if (Negative) pas.System.Delete({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},1,1);
      P = pas.System.Pos(".",Result);
      if (TS !== "") {
        if (P !== 0) {
          Result = $impl.ReplaceDecimalSep(Result,DS)}
         else P = Result.length + 1;
        P -= 3;
        while (P > 1) {
          pas.System.Insert(TS,{get: function () {
              return Result;
            }, set: function (v) {
              Result = v;
            }},P);
          P -= 3;
        };
      };
      if (Negative) $impl.RemoveLeadingNegativeSign({get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }},DS,TS);
      if (!Negative) {
        var $tmp = aSettings.CurrencyFormat;
        if ($tmp === 0) {
          Result = CS + Result}
         else if ($tmp === 1) {
          Result = Result + CS}
         else if ($tmp === 2) {
          Result = CS + " " + Result}
         else if ($tmp === 3) Result = Result + " " + CS;
      } else {
        var $tmp1 = aSettings.NegCurrFormat;
        if ($tmp1 === 0) {
          Result = "(" + CS + Result + ")"}
         else if ($tmp1 === 1) {
          Result = "-" + CS + Result}
         else if ($tmp1 === 2) {
          Result = CS + "-" + Result}
         else if ($tmp1 === 3) {
          Result = CS + Result + "-"}
         else if ($tmp1 === 4) {
          Result = "(" + Result + CS + ")"}
         else if ($tmp1 === 5) {
          Result = "-" + Result + CS}
         else if ($tmp1 === 6) {
          Result = Result + "-" + CS}
         else if ($tmp1 === 7) {
          Result = Result + CS + "-"}
         else if ($tmp1 === 8) {
          Result = "-" + Result + " " + CS}
         else if ($tmp1 === 9) {
          Result = "-" + CS + " " + Result}
         else if ($tmp1 === 10) {
          Result = Result + " " + CS + "-"}
         else if ($tmp1 === 11) {
          Result = CS + " " + Result + "-"}
         else if ($tmp1 === 12) {
          Result = CS + " " + "-" + Result}
         else if ($tmp1 === 13) {
          Result = Result + "-" + " " + CS}
         else if ($tmp1 === 14) {
          Result = "(" + CS + " " + Result + ")"}
         else if ($tmp1 === 15) Result = "(" + Result + " " + CS + ")";
      };
      return Result;
    };
    $impl.RESpecials = "([\\$\\+\\[\\]\\(\\)\\\\\\.\\*\\^\\?\\|])";
    $impl.DoEncodeDate = function (Year, Month, Day) {
      var Result = 0;
      var D = 0.0;
      if ($mod.TryEncodeDate(Year,Month,Day,{get: function () {
          return D;
        }, set: function (v) {
          D = v;
        }})) {
        Result = pas.System.Trunc(D)}
       else Result = 0;
      return Result;
    };
    $impl.DoEncodeTime = function (Hour, Minute, Second, MilliSecond) {
      var Result = 0.0;
      if (!$mod.TryEncodeTime(Hour,Minute,Second,MilliSecond,{get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }})) Result = 0;
      return Result;
    };
    $mod.$rtti.$StaticArray("DateTimeToStrFormat$a",{dims: [2], eltype: rtl.string});
    $impl.DateTimeToStrFormat = ["c","f"];
    var WhiteSpace = " \b\t\n\f\r";
    var Digits = "0123456789";
    $impl.IntStrToDate = function (ErrorMsg, S, useformat, separator) {
      var Result = 0.0;
      function FixErrorMsg(errmarg) {
        ErrorMsg.set($mod.Format(rtl.getResStr(pas.RTLConsts,"SInvalidDateFormat"),pas.System.VarRecs(18,errmarg)));
      };
      var df = "";
      var d = 0;
      var m = 0;
      var y = 0;
      var ly = 0;
      var ld = 0;
      var lm = 0;
      var n = 0;
      var i = 0;
      var len = 0;
      var c = 0;
      var dp = 0;
      var mp = 0;
      var yp = 0;
      var which = 0;
      var s1 = "";
      var values = [];
      var YearMoreThenTwoDigits = false;
      values = rtl.arraySetLength(values,0,4);
      Result = 0;
      len = S.length;
      ErrorMsg.set("");
      while ((len > 0) && (pas.System.Pos(S.charAt(len - 1),WhiteSpace) > 0)) len -= 1;
      if (len === 0) {
        FixErrorMsg(S);
        return Result;
      };
      YearMoreThenTwoDigits = false;
      if (separator === "\x00") if ($mod.FormatSettings.DateSeparator !== "\x00") {
        separator = $mod.FormatSettings.DateSeparator}
       else separator = "-";
      df = $mod.UpperCase(useformat);
      yp = 0;
      mp = 0;
      dp = 0;
      which = 0;
      i = 0;
      while ((i < df.length) && (which < 3)) {
        i += 1;
        var $tmp = df.charAt(i - 1);
        if ($tmp === "Y") {
          if (yp === 0) {
            which += 1;
            yp = which;
          }}
         else if ($tmp === "M") {
          if (mp === 0) {
            which += 1;
            mp = which;
          }}
         else if ($tmp === "D") if (dp === 0) {
          which += 1;
          dp = which;
        };
      };
      for (i = 1; i <= 3; i++) values[i] = 0;
      s1 = "";
      n = 0;
      for (var $l = 1, $end = len; $l <= $end; $l++) {
        i = $l;
        if (pas.System.Pos(S.charAt(i - 1),Digits) > 0) s1 = s1 + S.charAt(i - 1);
        if ((separator !== " ") && (S.charAt(i - 1) === " ")) continue;
        if ((S.charAt(i - 1) === separator) || ((i === len) && (pas.System.Pos(S.charAt(i - 1),Digits) > 0))) {
          n += 1;
          if (n > 3) {
            FixErrorMsg(S);
            return Result;
          };
          if ((n === yp) && (s1.length > 2)) YearMoreThenTwoDigits = true;
          pas.System.val$6(s1,{a: n, p: values, get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},{get: function () {
              return c;
            }, set: function (v) {
              c = v;
            }});
          if (c !== 0) {
            FixErrorMsg(S);
            return Result;
          };
          s1 = "";
        } else if (pas.System.Pos(S.charAt(i - 1),Digits) === 0) {
          FixErrorMsg(S);
          return Result;
        };
      };
      if ((which < 3) && (n > which)) {
        FixErrorMsg(S);
        return Result;
      };
      $mod.DecodeDate($mod.Date(),{get: function () {
          return ly;
        }, set: function (v) {
          ly = v;
        }},{get: function () {
          return lm;
        }, set: function (v) {
          lm = v;
        }},{get: function () {
          return ld;
        }, set: function (v) {
          ld = v;
        }});
      if (n === 3) {
        y = values[yp];
        m = values[mp];
        d = values[dp];
      } else {
        y = ly;
        if (n < 2) {
          d = values[1];
          m = lm;
        } else if (dp < mp) {
          d = values[1];
          m = values[2];
        } else {
          d = values[2];
          m = values[1];
        };
      };
      if ((y >= 0) && (y < 100) && !YearMoreThenTwoDigits) {
        ly = ly - $mod.TwoDigitYearCenturyWindow;
        y += rtl.trunc(ly / 100) * 100;
        if (($mod.TwoDigitYearCenturyWindow > 0) && (y < ly)) y += 100;
      };
      if (!$mod.TryEncodeDate(y,m,d,{get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }})) ErrorMsg.set(rtl.getResStr(pas.RTLConsts,"SErrInvalidDate"));
      return Result;
    };
    var AMPM_None = 0;
    var AMPM_AM = 1;
    var AMPM_PM = 2;
    var tiHour = 0;
    var tiMin = 1;
    var tiSec = 2;
    var tiMSec = 3;
    var Digits$1 = "0123456789";
    $impl.IntStrToTime = function (ErrorMsg, S, Len, aSettings) {
      var Result = 0.0;
      var AmPm = 0;
      var TimeValues = [];
      function SplitElements(TimeValues, AmPm) {
        var Result = false;
        var Cur = 0;
        var Offset = 0;
        var ElemLen = 0;
        var Err = 0;
        var TimeIndex = 0;
        var FirstSignificantDigit = 0;
        var Value = 0;
        var DigitPending = false;
        var MSecPending = false;
        var AmPmStr = "";
        var CurChar = "\x00";
        var I = 0;
        var allowedchars = "";
        Result = false;
        AmPm.set(0);
        MSecPending = false;
        TimeIndex = 0;
        for (I = 0; I <= 3; I++) TimeValues.get()[I] = 0;
        Cur = 1;
        while ((Cur < Len) && (S.charAt(Cur - 1) === " ")) Cur += 1;
        Offset = Cur;
        if ((Cur > (Len - 1)) || (S.charAt(Cur - 1) === aSettings.TimeSeparator) || (S.charAt(Cur - 1) === aSettings.DecimalSeparator)) {
          return Result;
        };
        DigitPending = pas.System.Pos(S.charAt(Cur - 1),Digits$1) > 0;
        while (Cur <= Len) {
          CurChar = S.charAt(Cur - 1);
          if (pas.System.Pos(CurChar,Digits$1) > 0) {
            if (!DigitPending || (TimeIndex > 3)) {
              return Result;
            };
            Offset = Cur;
            if (CurChar !== "0") {
              FirstSignificantDigit = Offset}
             else FirstSignificantDigit = -1;
            while ((Cur < Len) && (pas.System.Pos(S.charAt((Cur + 1) - 1),Digits$1) > 0)) {
              if ((FirstSignificantDigit === -1) && (S.charAt(Cur - 1) !== "0")) FirstSignificantDigit = Cur;
              Cur += 1;
            };
            if (FirstSignificantDigit === -1) FirstSignificantDigit = Cur;
            ElemLen = (1 + Cur) - FirstSignificantDigit;
            if ((ElemLen <= 2) || ((ElemLen <= 3) && (TimeIndex === 3))) {
              pas.System.val$6(pas.System.Copy(S,FirstSignificantDigit,ElemLen),{get: function () {
                  return Value;
                }, set: function (v) {
                  Value = v;
                }},{get: function () {
                  return Err;
                }, set: function (v) {
                  Err = v;
                }});
              TimeValues.get()[TimeIndex] = Value;
              TimeIndex += 1;
              DigitPending = false;
            } else {
              return Result;
            };
          } else if (CurChar === " ") {}
          else if (CurChar === aSettings.TimeSeparator) {
            if (DigitPending || (TimeIndex > 2)) {
              return Result;
            };
            DigitPending = true;
            MSecPending = false;
          } else if (CurChar === aSettings.DecimalSeparator) {
            if (DigitPending || MSecPending || (TimeIndex !== 3)) {
              return Result;
            };
            DigitPending = true;
            MSecPending = true;
          } else {
            if ((AmPm.get() !== 0) || DigitPending) {
              return Result;
            };
            Offset = Cur;
            allowedchars = aSettings.DecimalSeparator + " ";
            if (aSettings.TimeSeparator !== "\x00") allowedchars = allowedchars + aSettings.TimeSeparator;
            while ((Cur < Len) && (pas.System.Pos(S.charAt((Cur + 1) - 1),allowedchars) === 0) && (pas.System.Pos(S.charAt((Cur + 1) - 1),Digits$1) === 0)) Cur += 1;
            ElemLen = (1 + Cur) - Offset;
            AmPmStr = pas.System.Copy(S,Offset,ElemLen);
            if ($mod.CompareText(AmPmStr,aSettings.TimeAMString) === 0) {
              AmPm.set(1)}
             else if ($mod.CompareText(AmPmStr,aSettings.TimePMString) === 0) {
              AmPm.set(2)}
             else if ($mod.CompareText(AmPmStr,"AM") === 0) {
              AmPm.set(1)}
             else if ($mod.CompareText(AmPmStr,"PM") === 0) {
              AmPm.set(2)}
             else {
              return Result;
            };
            if (TimeIndex === 0) {
              DigitPending = true;
            } else {
              TimeIndex = 3 + 1;
              DigitPending = false;
            };
          };
          Cur += 1;
        };
        if ((TimeIndex === 0) || ((AmPm.get() !== 0) && ((TimeValues.get()[0] > 12) || (TimeValues.get()[0] === 0))) || DigitPending) return Result;
        Result = true;
        return Result;
      };
      TimeValues = rtl.arraySetLength(TimeValues,0,4);
      AmPm = 0;
      if (!SplitElements({get: function () {
          return TimeValues;
        }, set: function (v) {
          TimeValues = v;
        }},{get: function () {
          return AmPm;
        }, set: function (v) {
          AmPm = v;
        }})) {
        ErrorMsg.set($mod.Format(rtl.getResStr(pas.RTLConsts,"SErrInvalidTimeFormat"),pas.System.VarRecs(18,S)));
        return Result;
      };
      if ((AmPm === 2) && (TimeValues[0] !== 12)) {
        TimeValues[0] += 12}
       else if ((AmPm === 1) && (TimeValues[0] === 12)) TimeValues[0] = 0;
      if (!$mod.TryEncodeTime(TimeValues[0],TimeValues[1],TimeValues[2],TimeValues[3],{get: function () {
          return Result;
        }, set: function (v) {
          Result = v;
        }})) ErrorMsg.set($mod.Format(rtl.getResStr(pas.RTLConsts,"SErrInvalidTimeFormat"),pas.System.VarRecs(18,S)));
      return Result;
    };
    var WhiteSpace$1 = "\t\n\r ";
    $impl.SplitDateTimeStr = function (DateTimeStr, DateStr, TimeStr, aSettings) {
      var Result = 0;
      var p = 0;
      var DummyDT = 0.0;
      Result = 0;
      DateStr.set("");
      TimeStr.set("");
      DateTimeStr = $mod.Trim(DateTimeStr);
      if (DateTimeStr.length === 0) return Result;
      if ((aSettings.DateSeparator === " ") && (aSettings.TimeSeparator === " ") && (pas.System.Pos(" ",DateTimeStr) > 0)) {
        DateStr.set(DateTimeStr);
        return 1;
      };
      p = 1;
      if (aSettings.DateSeparator !== " ") {
        while ((p < DateTimeStr.length) && !(pas.System.Pos(DateTimeStr.charAt((p + 1) - 1),WhiteSpace$1) > 0)) p += 1;
      } else {
        p = pas.System.Pos(aSettings.TimeSeparator,DateTimeStr);
        if (p !== 0) do {
          p -= 1;
        } while (!((p === 0) || (pas.System.Pos(DateTimeStr.charAt(p - 1),WhiteSpace$1) > 0)));
      };
      if (p === 0) p = DateTimeStr.length;
      DateStr.set(pas.System.Copy(DateTimeStr,1,p));
      TimeStr.set($mod.Trim(pas.System.Copy(DateTimeStr,p + 1,100)));
      if (TimeStr.get().length !== 0) {
        Result = 2}
       else {
        Result = 1;
        if (((aSettings.DateSeparator !== aSettings.TimeSeparator) && (pas.System.Pos(aSettings.TimeSeparator,DateStr.get()) > 0)) || ((aSettings.DateSeparator === aSettings.TimeSeparator) && !$mod.TryStrToDate(DateStr.get(),{get: function () {
            return DummyDT;
          }, set: function (v) {
            DummyDT = v;
          }}))) {
          TimeStr.set(DateStr.get());
          DateStr.set("");
        };
      };
      return Result;
    };
    $impl.IntTryStrToInt = function (S, res, aSep) {
      var Result = false;
      var Radix = 10;
      var N = "";
      var J = undefined;
      N = S;
      if ((pas.System.Pos(aSep,N) !== 0) || (pas.System.Pos(".",N) !== 0)) return false;
      var $tmp = pas.System.Copy(N,1,1);
      if ($tmp === "$") {
        Radix = 16}
       else if ($tmp === "&") {
        Radix = 8}
       else if ($tmp === "%") Radix = 2;
      if ((Radix !== 16) && (pas.System.Pos("e",$mod.LowerCase(N)) !== 0)) return false;
      if (Radix !== 10) pas.System.Delete({get: function () {
          return N;
        }, set: function (v) {
          N = v;
        }},1,1);
      J = parseInt(N,Radix);
      Result = !isNaN(J);
      if (Result) res.set(rtl.trunc(J));
      return Result;
    };
    $impl.InitGlobalFormatSettings = function () {
      $mod.FormatSettings.$assign($mod.TFormatSettings.Create());
      $mod.TimeSeparator = $mod.FormatSettings.TimeSeparator;
      $mod.DateSeparator = $mod.FormatSettings.DateSeparator;
      $mod.ShortDateFormat = $mod.FormatSettings.ShortDateFormat;
      $mod.LongDateFormat = $mod.FormatSettings.LongDateFormat;
      $mod.ShortTimeFormat = $mod.FormatSettings.ShortTimeFormat;
      $mod.LongTimeFormat = $mod.FormatSettings.LongTimeFormat;
      $mod.DecimalSeparator = $mod.FormatSettings.DecimalSeparator;
      $mod.ThousandSeparator = $mod.FormatSettings.ThousandSeparator;
      $mod.TimeAMString = $mod.FormatSettings.TimeAMString;
      $mod.TimePMString = $mod.FormatSettings.TimePMString;
      $mod.CurrencyFormat = $mod.FormatSettings.CurrencyFormat;
      $mod.NegCurrFormat = $mod.FormatSettings.NegCurrFormat;
      $mod.CurrencyDecimals = $mod.FormatSettings.CurrencyDecimals;
      $mod.CurrencyString = $mod.FormatSettings.CurrencyString;
    };
    $impl.NotImplemented = function (S) {
      throw $mod.Exception.$create("Create$1",["Not yet implemented : " + S]);
    };
    $impl.HaveChar = function (AChar, AList) {
      var Result = false;
      var I = 0;
      I = 0;
      Result = false;
      while (!Result && (I < rtl.length(AList))) {
        Result = AList[I] === AChar;
        I += 1;
      };
      return Result;
    };
    rtl.recNewT($impl,"TFloatParts",function () {
      this.sign = false;
      this.exp = 0;
      this.mantissa = 0.0;
      this.$eq = function (b) {
        return (this.sign === b.sign) && (this.exp === b.exp) && (this.mantissa === b.mantissa);
      };
      this.$assign = function (s) {
        this.sign = s.sign;
        this.exp = s.exp;
        this.mantissa = s.mantissa;
        return this;
      };
      var $r = $mod.$rtti.$Record("TFloatParts",{},this);
      $r.addField("sign",rtl.boolean);
      $r.addField("exp",rtl.longint);
      $r.addField("mantissa",rtl.double);
    });
    $impl.FloatToParts = function (aValue) {
      var Result = $impl.TFloatParts.$new();
      var F = null;
      var B = null;
      F = new Float64Array(1);
      B = new Uint8Array(F.buffer);
      F[0] = aValue;
      Result.sign = (B[7] >>> 7) === 0;
      Result.exp = (((B[7] & 0x7f) << 4) | (B[6] >>> 4)) - 0x3ff;
      B[3] = 0x3F;
      B[6] = B[6] | 0xF0;
      Result.mantissa = F[0];
      return Result;
    };
    $mod.$rtti.$ClassRef("TExceptionClass",{instancetype: $mod.$rtti["Exception"]});
    $impl.DoClassRef = function (C) {
      if (C === null) ;
    };
    $mod.$resourcestrings = {SAbortError: {org: "Operation aborted"}, SApplicationException: {org: "Application raised an exception: "}, SErrUnknownExceptionType: {org: "Caught unknown exception type : "}};
  };
  $mod.$init = function () {
    (function () {
      $impl.InitGlobalFormatSettings();
    })();
    $impl.DoClassRef($mod.EInvalidCast);
    $impl.DoClassRef($mod.EAbstractError);
    $impl.DoClassRef($mod.ERangeError);
    $mod.ShortMonthNames = $impl.DefaultShortMonthNames.slice(0);
    $mod.LongMonthNames = $impl.DefaultLongMonthNames.slice(0);
    $mod.ShortDayNames = $impl.DefaultShortDayNames.slice(0);
    $mod.LongDayNames = $impl.DefaultLongDayNames.slice(0);
  };
},[]);
rtl.module("DiffBase",["System","StdUtils"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.NoColour = 0;
  this.Spades = 1;
  this.Hearts = 2;
  this.Diamonds = 3;
  this.Clubs = 4;
  this.kColourHigh = 4;
  this.kTrumpHigh = 4;
  this.NoRank = 0;
  this.Six = 1;
  this.Seven = 2;
  this.Eight = 3;
  this.Nine = 4;
  this.Ten = 5;
  this.Knave = 6;
  this.Queen = 7;
  this.King = 8;
  this.Ace = 9;
  this.kRankHigh = 9;
  this.NoCard = 0;
  this.kCardHigh = 4 * 9;
  this.NoPlayer = 0;
  this.North = 1;
  this.West = 2;
  this.South = 3;
  this.East = 4;
  this.kPlayerHigh = 4;
  this.kHideHide = 0;
  this.kHideShow = 1;
  this.kShowShow = 2;
  this.kHandHigh = 12 - 1;
  this.kTricksMax = 11 + 1;
  this.kRoundsHigh = 48 - 1;
  this.NoCall = -10000;
  this.NoStockings = 0;
  this.kStockingsAdd = 1;
  this.kStockingsSub = 2;
  this.kNoRnd = 0;
  this.kMaxRnd = 10;
  this.kPointsPerRound = 157;
  this.$rtti.$Int("TRank",{minvalue: 0, maxvalue: 9, ordtype: 1});
  this.$rtti.$Int("TColour",{minvalue: 0, maxvalue: 4, ordtype: 1});
  this.$rtti.$Set("TColourSet",{comptype: this.$rtti["TColour"]});
  this.$rtti.$Int("TTrump",{minvalue: 0, maxvalue: 4, ordtype: 1});
  this.$rtti.$Set("TTrumpSet",{comptype: this.$rtti["TTrump"]});
  this.$rtti.$Int("TCard",{minvalue: 0, maxvalue: 36, ordtype: 1});
  this.$rtti.$Set("TCardSet",{comptype: this.$rtti["TCard"]});
  this.$rtti.$Int("TPlayer",{minvalue: 0, maxvalue: 4, ordtype: 1});
  this.$rtti.$Set("TPlayerSet",{comptype: this.$rtti["TPlayer"]});
  this.$rtti.$StaticArray("THand",{dims: [12], eltype: this.$rtti["TCard"]});
  this.THands$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("THands",{dims: [5,12], eltype: this.$rtti["TCard"]});
  rtl.recNewT(this,"TTrick",function () {
    this.fLeading = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fPlayed = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return (this.fLeading === b.fLeading) && rtl.arrayEq(this.fPlayed,b.fPlayed);
    };
    this.$assign = function (s) {
      this.fLeading = s.fLeading;
      this.fPlayed = s.fPlayed.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("TTrick",{},this);
    $r.addField("fLeading",$mod.$rtti["TPlayer"]);
    $mod.$rtti.$StaticArray("TTrick.fPlayed$a",{dims: [5], eltype: $mod.$rtti["TCard"]});
    $r.addField("fPlayed",$mod.$rtti["TTrick.fPlayed$a"]);
  });
  this.$rtti.$StaticArray("TPlayCircle",{dims: [5], eltype: this.$rtti["TPlayer"]});
  this.$rtti.$StaticArray("TDeltas",{dims: [5], eltype: rtl.longint});
  this.$rtti.$StaticArray("TCounts",{dims: [5], eltype: rtl.longint});
  this.$rtti.$StaticArray("TTable",{dims: [5], eltype: rtl.longint});
  rtl.recNewT(this,"TRound",function () {
    this.fDrawn = 0;
    this.fTrump = 0;
    this.fStocksFor = 0;
    this.fStockings = 0;
    this.fTrick = 0;
    this.fTricks$a$clone = function (a) {
      var b = [];
      b.length = 13;
      for (var c = 0; c < 13; c++) b[c] = $mod.TTrick.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fCall = rtl.arraySetLength(null,0,5);
      r.fMade = rtl.arraySetLength(null,0,5);
      r.fBonus = rtl.arraySetLength(null,0,5);
      r.fTricks = rtl.arraySetLength(null,$mod.TTrick,13);
      return r;
    };
    this.$eq = function (b) {
      return (this.fDrawn === b.fDrawn) && (this.fTrump === b.fTrump) && rtl.arrayEq(this.fCall,b.fCall) && rtl.arrayEq(this.fMade,b.fMade) && rtl.arrayEq(this.fBonus,b.fBonus) && (this.fStocksFor === b.fStocksFor) && (this.fStockings === b.fStockings) && (this.fTrick === b.fTrick) && rtl.arrayEq(this.fTricks,b.fTricks);
    };
    this.$assign = function (s) {
      this.fDrawn = s.fDrawn;
      this.fTrump = s.fTrump;
      this.fCall = s.fCall.slice(0);
      this.fMade = s.fMade.slice(0);
      this.fBonus = s.fBonus.slice(0);
      this.fStocksFor = s.fStocksFor;
      this.fStockings = s.fStockings;
      this.fTrick = s.fTrick;
      this.fTricks = this.fTricks$a$clone(s.fTricks);
      return this;
    };
    var $r = $mod.$rtti.$Record("TRound",{},this);
    $r.addField("fDrawn",$mod.$rtti["TCard"]);
    $r.addField("fTrump",$mod.$rtti["TTrump"]);
    $r.addField("fCall",$mod.$rtti["TDeltas"]);
    $r.addField("fMade",$mod.$rtti["TDeltas"]);
    $r.addField("fBonus",$mod.$rtti["TDeltas"]);
    $r.addField("fStocksFor",$mod.$rtti["TPlayer"]);
    $r.addField("fStockings",rtl.longint);
    $r.addField("fTrick",rtl.longint);
    $mod.$rtti.$StaticArray("TRound.fTricks$a",{dims: [13], eltype: $mod.$rtti["TTrick"]});
    $r.addField("fTricks",$mod.$rtti["TRound.fTricks$a"]);
  });
  rtl.recNewT(this,"TRules",function () {
    this.fNuPlayers = 0;
    this.fRoundLimit = 0;
    this.fSumUpRanks = false;
    this.fCallMode = 0;
    this.fSCallBonus = false;
    this.fDZeroBonus = 0;
    this.fStockings = 0;
    this.$eq = function (b) {
      return (this.fNuPlayers === b.fNuPlayers) && (this.fRoundLimit === b.fRoundLimit) && (this.fSumUpRanks === b.fSumUpRanks) && (this.fCallMode === b.fCallMode) && (this.fSCallBonus === b.fSCallBonus) && (this.fDZeroBonus === b.fDZeroBonus) && (this.fStockings === b.fStockings);
    };
    this.$assign = function (s) {
      this.fNuPlayers = s.fNuPlayers;
      this.fRoundLimit = s.fRoundLimit;
      this.fSumUpRanks = s.fSumUpRanks;
      this.fCallMode = s.fCallMode;
      this.fSCallBonus = s.fSCallBonus;
      this.fDZeroBonus = s.fDZeroBonus;
      this.fStockings = s.fStockings;
      return this;
    };
    var $r = $mod.$rtti.$Record("TRules",{},this);
    $r.addField("fNuPlayers",rtl.longint);
    $r.addField("fRoundLimit",rtl.longint);
    $r.addField("fSumUpRanks",rtl.boolean);
    $r.addField("fCallMode",rtl.longint);
    $r.addField("fSCallBonus",rtl.boolean);
    $r.addField("fDZeroBonus",rtl.longint);
    $r.addField("fStockings",rtl.longint);
  });
  rtl.recNewT(this,"TJassState",function () {
    this.fTricksHigh = 0;
    this.fRoundTotal = 0;
    this.fRound = 0;
    this.fRounds$a$clone = function (a) {
      var b = [];
      b.length = 48;
      for (var c = 0; c < 48; c++) b[c] = $mod.TRound.$clone(a[c]);
      return b;
    };
    this.fLeading = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fRules = $mod.TRules.$new();
      r.fNextPlayer = rtl.arraySetLength(null,0,5);
      r.fPrevPlayer = rtl.arraySetLength(null,0,5);
      r.fTotal = rtl.arraySetLength(null,0,5);
      r.fFinal = rtl.arraySetLength(null,0,5);
      r.fRounds = rtl.arraySetLength(null,$mod.TRound,48);
      r.fHands = rtl.arraySetLength(null,0,5,12);
      return r;
    };
    this.$eq = function (b) {
      return this.fRules.$eq(b.fRules) && (this.fTricksHigh === b.fTricksHigh) && rtl.arrayEq(this.fNextPlayer,b.fNextPlayer) && rtl.arrayEq(this.fPrevPlayer,b.fPrevPlayer) && (this.fRoundTotal === b.fRoundTotal) && rtl.arrayEq(this.fTotal,b.fTotal) && rtl.arrayEq(this.fFinal,b.fFinal) && (this.fRound === b.fRound) && rtl.arrayEq(this.fRounds,b.fRounds) && (this.fLeading === b.fLeading) && rtl.arrayEq(this.fHands,b.fHands);
    };
    this.$assign = function (s) {
      this.fRules.$assign(s.fRules);
      this.fTricksHigh = s.fTricksHigh;
      this.fNextPlayer = s.fNextPlayer.slice(0);
      this.fPrevPlayer = s.fPrevPlayer.slice(0);
      this.fRoundTotal = s.fRoundTotal;
      this.fTotal = s.fTotal.slice(0);
      this.fFinal = s.fFinal.slice(0);
      this.fRound = s.fRound;
      this.fRounds = this.fRounds$a$clone(s.fRounds);
      this.fLeading = s.fLeading;
      this.fHands = $mod.THands$clone(s.fHands);
      return this;
    };
    var $r = $mod.$rtti.$Record("TJassState",{},this);
    $r.addField("fRules",$mod.$rtti["TRules"]);
    $r.addField("fTricksHigh",rtl.longint);
    $r.addField("fNextPlayer",$mod.$rtti["TPlayCircle"]);
    $r.addField("fPrevPlayer",$mod.$rtti["TPlayCircle"]);
    $r.addField("fRoundTotal",rtl.longint);
    $r.addField("fTotal",$mod.$rtti["TDeltas"]);
    $r.addField("fFinal",$mod.$rtti["TTable"]);
    $r.addField("fRound",rtl.longint);
    $mod.$rtti.$StaticArray("TJassState.fRounds$a",{dims: [48], eltype: $mod.$rtti["TRound"]});
    $r.addField("fRounds",$mod.$rtti["TJassState.fRounds$a"]);
    $r.addField("fLeading",$mod.$rtti["TPlayer"]);
    $r.addField("fHands",$mod.$rtti["THands"]);
  });
  this.$rtti.$Pointer("JassStatePtr",{reftype: this.$rtti["TJassState"]});
  this.$rtti.$Int("TRndID",{minvalue: 0, maxvalue: 10, ordtype: 1});
  rtl.recNewT(this,"TRndData",function () {
    this.fUsed = false;
    this.fName = "";
    this.fSeed = 0;
    this.$eq = function (b) {
      return (this.fUsed === b.fUsed) && (this.fName === b.fName) && (this.fSeed === b.fSeed);
    };
    this.$assign = function (s) {
      this.fUsed = s.fUsed;
      this.fName = s.fName;
      this.fSeed = s.fSeed;
      return this;
    };
    var $r = $mod.$rtti.$Record("TRndData",{},this);
    $r.addField("fUsed",rtl.boolean);
    $r.addField("fName",rtl.string);
    $r.addField("fSeed",rtl.longint);
  });
  this.BetterCardTab$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) {
      var d = b[c] = [];
      d.length = 37;
      var e = a[c];
      for (var f = 0; f < 37; f++) d[f] = e[f].slice(0);
    };
    return b;
  };
  this.$rtti.$StaticArray("BetterCardTab",{dims: [5,37,37], eltype: rtl.boolean});
  this.ValueOfCardTab$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("ValueOfCardTab",{dims: [5,37], eltype: rtl.longint});
  this.$rtti.$StaticArray("ColourNameTab",{dims: [5], eltype: rtl.string});
  this.$rtti.$StaticArray("RankNameTab",{dims: [10], eltype: rtl.string});
  this.gCardOf$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("gCardOf$a",{dims: [5,10], eltype: this.$rtti["TCard"]});
  this.gCardOf = rtl.arraySetLength(null,0,5,10);
  this.$rtti.$StaticArray("gColourOf$a",{dims: [37], eltype: this.$rtti["TColour"]});
  this.gColourOf = rtl.arraySetLength(null,0,37);
  this.$rtti.$StaticArray("gRankOf$a",{dims: [37], eltype: this.$rtti["TRank"]});
  this.gRankOf = rtl.arraySetLength(null,0,37);
  this.$rtti.$StaticArray("gTrumpRank$a",{dims: [10], eltype: this.$rtti["TRank"]});
  this.gTrumpRank = rtl.arraySetLength(null,0,10);
  this.gBetterCard = rtl.arraySetLength(null,false,5,37,37);
  this.gValueOfCard = rtl.arraySetLength(null,0,5,37);
  this.gColourName = rtl.arraySetLength(null,"",5);
  this.gRankName = rtl.arraySetLength(null,"",10);
  this.gRnd$a$clone = function (a) {
    var b = [];
    b.length = 11;
    for (var c = 0; c < 11; c++) b[c] = $mod.TRndData.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("gRnd$a",{dims: [11], eltype: this.$rtti["TRndData"]});
  this.gRnd = rtl.arraySetLength(null,this.TRndData,11);
  this.gDealRnd = 0;
  this.gOwnerInfo = "";
  this.gVersionInfo = "";
  this.SetGlobalRules = function (rules) {
    if ($mod.ValidRules($mod.TRules.$clone(rules))) $impl.gRules.$assign(rules);
  };
  this.GetGlobalRules = function (rules) {
    rules.$assign($impl.gRules);
  };
  this.ValidRules = function (rules) {
    var Result = false;
    var valid = false;
    var gotOne = false;
    valid = true;
    valid = valid && (rules.fRoundLimit > 0);
    valid = valid && (rules.fDZeroBonus >= 0);
    Result = valid;
    return Result;
  };
  this.ValueOfCard = function (trump, card) {
    var Result = 0;
    var colour = 0;
    colour = $mod.gColourOf[card];
    var $tmp = $mod.gRankOf[card];
    if (($tmp === 1) || ($tmp === 2) || ($tmp === 3)) {
      Result = 0}
     else if ($tmp === 4) {
      if (colour === trump) {
        Result = 14}
       else Result = 0}
     else if ($tmp === 5) {
      Result = 10}
     else if ($tmp === 6) {
      if (colour === trump) {
        Result = 20}
       else Result = 2}
     else if ($tmp === 7) {
      Result = 3}
     else if ($tmp === 8) {
      Result = 4}
     else if ($tmp === 9) {
      Result = 11}
     else {
      Result = 0;
    };
    return Result;
  };
  this.ValueOfTrick = function (trump, trick) {
    var Result = 0;
    var sum = 0;
    var p = 0;
    Result = 0;
    sum = 0;
    for (p = 1; p <= 4; p++) {
      if ((trick.fPlayed[p] > 0) && (trick.fPlayed[p] <= 36)) sum = sum + $mod.gValueOfCard[trump][trick.fPlayed[p]];
    };
    Result = sum;
    return Result;
  };
  this.DeltaOf = function (Call, made, bonus) {
    var Result = 0;
    Result = Math.abs(Call - made) - bonus;
    return Result;
  };
  this.TableOf = function (nuPlayers, value, table) {
    var p = 0;
    var q = 0;
    for (p = 0; p <= 4; p++) table.get()[p] = 0;
    for (var $l = 1, $end = nuPlayers; $l <= $end; $l++) {
      p = $l;
      table.get()[p] = 1;
      for (var $l1 = 1, $end1 = nuPlayers; $l1 <= $end1; $l1++) {
        q = $l1;
        if ((q !== p) && (value.get()[q] < value.get()[p])) table.get()[p] = table.get()[p] + 1;
      };
    };
  };
  this.TrumpRank = function (rank) {
    var Result = 0;
    Result = 0;
    var $tmp = rank;
    if (($tmp >= 1) && ($tmp <= 3)) {
      Result = rank}
     else if ($tmp === 4) {
      Result = 8}
     else if ($tmp === 5) {
      Result = 4}
     else if ($tmp === 6) {
      Result = 9}
     else if (($tmp >= 7) && ($tmp <= 9)) {
      Result = rank - 1 - 1}
     else {
      $mod.LogWriteLn("***JassBase: TrumpRank - Illegal rank.");
    };
    return Result;
  };
  this.BetterCard = function (trump, prev, This) {
    var Result = false;
    if (This === 0) {
      Result = false}
     else if (prev === 0) {
      Result = true}
     else {
      if ($mod.gColourOf[This] === trump) {
        Result = ($mod.gColourOf[prev] !== trump) || ($mod.TrumpRank($mod.gRankOf[This]) > $mod.TrumpRank($mod.gRankOf[prev]))}
       else Result = ($mod.gColourOf[This] === $mod.gColourOf[prev]) && ($mod.gRankOf[This] > $mod.gRankOf[prev]);
    };
    return Result;
  };
  this.HandToCardSet = function (hand) {
    var Result = {};
    var cards = {};
    var i = 0;
    cards = {};
    for (i = 0; i <= 11; i++) cards = rtl.unionSet(cards,rtl.createSet(hand[i]));
    Result = rtl.diffSet(cards,rtl.createSet(0));
    return Result;
  };
  this.CardSetToHand = function (cards, hand) {
    var card = 0;
    var i = 0;
    i = 0;
    for (card = 1; card <= 36; card++) {
      if ((card in cards) && (i <= 11)) {
        hand.get()[i] = card;
        i = i + 1;
      };
    };
    while (i <= 11) {
      hand.get()[i] = 0;
      i = i + 1;
    };
  };
  this.SortHand = function (hand) {
    var cards = {};
    cards = rtl.refSet($mod.HandToCardSet(hand.get().slice(0)));
    $mod.CardSetToHand(rtl.refSet(cards),hand);
  };
  this.LegalHand = function (trump, trick, hand, legal) {
    var card = 0;
    var best = 0;
    var colour = 0;
    var i = 0;
    var rank = 0;
    var p = 0;
    var none = false;
    legal.set(hand.slice(0));
    if (trick.fPlayed[trick.fLeading] !== 0) {
      card = trick.fPlayed[trick.fLeading];
      none = true;
      if (trump === $mod.gColourOf[card]) {
        for (i = 0; i <= 11; i++) if ($mod.gColourOf[legal.get()[i]] === trump) {
          none = none && ($mod.gCardOf[trump][6] === legal.get()[i])}
         else legal.get()[i] = 0;
        if (none) legal.set(hand.slice(0));
      } else {
        best = card;
        for (p = 1; p <= 4; p++) if ($mod.gBetterCard[trump][best][trick.fPlayed[p]]) best = trick.fPlayed[p];
        if ($mod.gColourOf[best] === trump) {
          rank = $mod.TrumpRank($mod.gRankOf[best])}
         else rank = 0;
        for (i = 0; i <= 11; i++) {
          colour = $mod.gColourOf[legal.get()[i]];
          if (colour === $mod.gColourOf[card]) {
            none = false}
           else if ((colour !== trump) || ($mod.TrumpRank($mod.gRankOf[legal.get()[i]]) < rank)) legal.get()[i] = 0;
        };
        if (none) {
          legal.set(hand.slice(0));
        };
      };
    };
  };
  this.DealCards = function (rules, hands) {
    var cards = {};
    var card = 0;
    var i = 0;
    var c = 0;
    var count = 0;
    var handHigh = 0;
    var p = 0;
    for (p = 0; p <= 4; p++) {
      for (i = 0; i <= 11; i++) hands.get()[p][i] = 0;
    };
    cards = rtl.createSet(null,0 + 1,36);
    count = 36;
    handHigh = rtl.trunc(36 / rules.fNuPlayers) - 1;
    for (var $l = 0, $end = handHigh; $l <= $end; $l++) {
      i = $l;
      for (var $l1 = 1, $end1 = (1 + rules.fNuPlayers) - 1; $l1 <= $end1; $l1++) {
        p = $l1;
        c = $mod.Rnd($mod.gDealRnd,true) % count;
        card = 0;
        do {
          card = card + 1;
          while ((card <= 36) && !(card in cards)) card = card + 1;
          c = c - 1;
        } while (!(c < 0));
        if (card <= 36) cards = rtl.diffSet(cards,rtl.createSet(card));
        hands.get()[p][i] = card;
        count = count - 1;
      };
    };
    for (var $l2 = 1, $end2 = (1 + rules.fNuPlayers) - 1; $l2 <= $end2; $l2++) {
      p = $l2;
      $mod.SortHand({a: p, p: hands.get(), get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
    };
  };
  this.SetupPrevNext = function (nuPlayers, prev, next) {
    var p = 0;
    for (p = 0; p <= 4; p++) {
      if ((p > 0) && (p <= nuPlayers)) {
        if ((p - 1) === 0) {
          prev.get()[p] = nuPlayers}
         else prev.get()[p] = p - 1;
        if (p === nuPlayers) {
          next.get()[p] = 0 + 1}
         else next.get()[p] = p + 1;
      } else {
        next.get()[p] = 0;
        prev.get()[p] = 0;
      };
    };
  };
  this.WinnerOfTrick = function (next, trump, trick) {
    var Result = 0;
    var best = 0;
    var curr = 0;
    Result = 0;
    if ((trump <= 0) || (trump > 4)) {
      return Result;
    };
    best = trick.fLeading;
    if ((best <= 0) || (best > 4)) {
      return Result;
    };
    for (curr = 1; curr <= 4; curr++) {
      if ((trick.fPlayed[curr] < 0) || (trick.fPlayed[curr] > 36)) trick.fPlayed[curr] = 0;
    };
    curr = next.get()[best];
    do {
      if ($mod.gBetterCard[trump][trick.fPlayed[best]][trick.fPlayed[curr]]) best = curr;
      curr = next.get()[curr];
    } while (!((curr === trick.fLeading) || (curr === 0)));
    Result = best;
    return Result;
  };
  this.NrInTrick = function (trick) {
    var Result = 0;
    var player = 0;
    var nr = 0;
    nr = 0;
    for (player = 1; player <= 4; player++) if ((trick.fPlayed[player] > 0) && (trick.fPlayed[player] <= 36)) nr = nr + 1;
    Result = nr;
    return Result;
  };
  this.InitJassState = function (state) {
    var i = 0;
    var j = 0;
    var p = 0;
    $mod.GetGlobalRules(state.fRules);
    state.fTricksHigh = 0;
    for (p = 0; p <= 4; p++) {
      state.fTotal[p] = 0;
      state.fFinal[p] = 0;
    };
    state.fRoundTotal = 0;
    state.fRound = 0;
    state.fLeading = 0;
    for (i = 0; i <= 47; i++) {
      state.fRounds[i].fDrawn = 0;
      state.fRounds[i].fTrump = 0;
      state.fRounds[i].fStocksFor = 0;
      state.fRounds[i].fStockings = 0;
      state.fRounds[i].fTrick = 0;
      state.fRounds[i].fTricks[0].fLeading = 0;
      for (p = 0; p <= 4; p++) {
        state.fRounds[i].fCall[p] = -10000;
        state.fRounds[i].fMade[p] = -10000;
        state.fRounds[i].fBonus[p] = 0;
      };
      for (j = 0; j <= 12; j++) {
        for (p = 0; p <= 4; p++) {
          state.fRounds[i].fTricks[j].fPlayed[p] = 0;
        };
      };
    };
    for (p = 0; p <= 4; p++) {
      state.fNextPlayer[p] = 0;
      state.fPrevPlayer[p] = 0;
      $mod.CardSetToHand({},{a: p, p: state.fHands, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
    };
    $mod.SetupPrevNext($impl.gRules.fNuPlayers,{p: state, get: function () {
        return this.p.fPrevPlayer;
      }, set: function (v) {
        this.p.fPrevPlayer = v;
      }},{p: state, get: function () {
        return this.p.fNextPlayer;
      }, set: function (v) {
        this.p.fNextPlayer = v;
      }});
  };
  this.SetupJassState = function (state, rules, leads) {
    $mod.InitJassState(state);
    state.fRules.$assign(rules);
    state.fTricksHigh = rtl.trunc(36 / rules.fNuPlayers);
    state.fLeading = leads;
    state.fRounds[0].fTricks[0].fLeading = leads;
    $mod.SetupPrevNext(rules.fNuPlayers,{p: state, get: function () {
        return this.p.fPrevPlayer;
      }, set: function (v) {
        this.p.fPrevPlayer = v;
      }},{p: state, get: function () {
        return this.p.fNextPlayer;
      }, set: function (v) {
        this.p.fNextPlayer = v;
      }});
  };
  this.ResetJassState = function (state) {
    var i = 0;
    var j = 0;
    var p = 0;
    for (p = 0; p <= 4; p++) {
      state.fTotal[p] = 0;
      state.fFinal[p] = 0;
    };
    state.fRoundTotal = 0;
    state.fRound = 0;
    state.fLeading = 1;
    for (i = 0; i <= 47; i++) {
      state.fRounds[i].fDrawn = 0;
      state.fRounds[i].fTrump = 0;
      state.fRounds[i].fStocksFor = 0;
      state.fRounds[i].fStockings = 0;
      state.fRounds[i].fTrick = 0;
      state.fRounds[i].fTricks[0].fLeading = 0;
      for (p = 0; p <= 4; p++) {
        state.fRounds[i].fCall[p] = -10000;
        state.fRounds[i].fMade[p] = -10000;
        state.fRounds[i].fBonus[p] = 0;
      };
      for (j = 0; j <= 12; j++) {
        for (p = 0; p <= 4; p++) {
          state.fRounds[i].fTricks[j].fPlayed[p] = 0;
        };
      };
    };
  };
  this.GetLeadingPlayer = function (state) {
    var Result = 0;
    Result = 0;
    if (state.fRound > 47) return Result;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick <= state.fTricksHigh) {
      if ($with.fTricks[$with.fTrick].fLeading === 0) {
        Result = state.fLeading}
       else Result = $with.fTricks[$with.fTrick].fLeading;
    };
    return Result;
  };
  this.GetCurrentPlayer = function (state) {
    var Result = 0;
    var p = 0;
    var q = 0;
    Result = 0;
    if (state.fRound > 47) return Result;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick < state.fTricksHigh) {
      p = $mod.GetLeadingPlayer(state);
      q = p;
      if (($with.fTrick === 0) && ($with.fTricks[0].fPlayed[p] === 0)) {
        do {
          if ($with.fCall[p] !== -10000) p = state.fNextPlayer[p];
        } while (!((p === q) || ($with.fCall[p] === -10000)));
      } else {
        do {
          if ($with.fTricks[$with.fTrick].fPlayed[p] !== 0) p = state.fNextPlayer[p];
        } while (!((p === q) || ($with.fTricks[$with.fTrick].fPlayed[p] === 0)));
      };
      Result = p;
    } else {
      Result = $with.fTricks[state.fTricksHigh].fLeading;
    };
    return Result;
  };
  this.GetActivePlayers = function (state, active) {
    var P = 0;
    active.set({});
    for (P = 1; P <= 4; P++) {
      if (state.fNextPlayer[P] !== 0) active.set(rtl.unionSet(active.get(),rtl.createSet(P)));
    };
  };
  this.GetCurrentTrick = function (state, trick) {
    var p = 0;
    for (p = 0; p <= 4; p++) trick.fPlayed[p] = 0;
    trick.fLeading = 0;
    if (state.fRound <= 47) {
      var $with = state.fRounds[state.fRound];
      if ($with.fTrick <= state.fTricksHigh) trick.$assign($with.fTricks[$with.fTrick]);
    };
  };
  this.GetCurrentTrump = function (state, trump) {
    if (state.fRound > 47) return;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick < state.fTricksHigh) {
      trump.set($with.fTrump)}
     else trump.set(0);
  };
  this.GetTricksWon = function (state, round, count, index) {
    var p = 0;
    var i = 0;
    for (p = 0; p <= 4; p++) count.get()[p] = 0;
    if ((round.fTrick > state.fTricksHigh) || (round.fTrump === 0)) return;
    for (var $l = 0, $end = round.fTrick - 1; $l <= $end; $l++) {
      i = $l;
      p = round.fTricks[i + 1].fLeading;
      index.get()[p][count.get()[p]] = i;
      count.get()[p] = count.get()[p] + 1;
    };
  };
  this.NeedStockings = function (state, fromPlayer) {
    var Result = false;
    var c = 0;
    var i = 0;
    fromPlayer.set(0);
    var $with = state.fRounds[state.fRound];
    if (($with.fTrick > 0) && (state.fRules.fStockings !== 0) && ($with.fStocksFor === 0)) {
      fromPlayer.set($mod.GetCurrentPlayer(state));
      if (fromPlayer.get() === $with.fTricks[$with.fTrick].fLeading) {
        fromPlayer.set(state.fPrevPlayer[$with.fTricks[$with.fTrick - 1].fLeading])}
       else fromPlayer.set(state.fPrevPlayer[fromPlayer.get()]);
      c = 0;
      for (var $l = 0, $end = $with.fTrick; $l <= $end; $l++) {
        i = $l;
        if (($with.fTricks[i].fPlayed[fromPlayer.get()] === $mod.gCardOf[$with.fTrump][7]) || ($with.fTricks[i].fPlayed[fromPlayer.get()] === $mod.gCardOf[$with.fTrump][8])) c = c + 1;
      };
      if (c !== 2) fromPlayer.set(0);
    };
    Result = fromPlayer.get() !== 0;
    return Result;
  };
  this.PlayStockings = function (state, player, stockings) {
    var $with = state.fRounds[state.fRound];
    $with.fStocksFor = player;
    $with.fStockings = stockings;
  };
  this.RoundFinished = function (state) {
    var Result = false;
    Result = (state.fRound >= 47) || (state.fRounds[state.fRound].fTrick >= state.fTricksHigh);
    return Result;
  };
  this.MatchFinished = function (state) {
    var Result = false;
    Result = state.fRoundTotal >= state.fRules.fRoundLimit;
    return Result;
  };
  this.PrepareRound = function (state, hands, drawnCard) {
    var i = 0;
    var j = 0;
    var p = 0;
    if (state.fRound >= 47) {
      for (i = 0; i <= 47; i++) {
        state.fRounds[i].fDrawn = 0;
        state.fRounds[i].fTrump = 0;
        state.fRounds[i].fStocksFor = 0;
        state.fRounds[i].fStockings = 0;
        state.fRounds[i].fTrick = 0;
        state.fRounds[i].fTricks[0].fLeading = 0;
        for (p = 0; p <= 4; p++) {
          state.fRounds[i].fCall[p] = -10000;
          state.fRounds[i].fMade[p] = -10000;
          state.fRounds[i].fBonus[p] = 0;
        };
        for (j = 0; j <= 12; j++) {
          for (p = 0; p <= 4; p++) {
            state.fRounds[i].fTricks[j].fPlayed[p] = 0;
          };
        };
      };
      state.fRound = 0;
    };
    state.fHands = $mod.THands$clone(hands);
    var $with = state.fRounds[state.fRound];
    for (p = 0; p <= 4; p++) {
      $with.fCall[p] = -10000;
      $with.fMade[p] = -10000;
      $with.fBonus[p] = 0;
    };
    $with.fTrick = 0;
    for (i = 0; i <= 12; i++) {
      $with.fTricks[i].fLeading = 0;
      for (j = 0; j <= 4; j++) {
        $with.fTricks[i].fPlayed[j] = 0;
      };
    };
    $with.fTricks[$with.fTrick].fLeading = state.fLeading;
    if (drawnCard === 0) {
      $with.fDrawn = hands[state.fPrevPlayer[state.fLeading]][$mod.Rnd($mod.gDealRnd,true) % state.fTricksHigh]}
     else $with.fDrawn = drawnCard;
    $with.fTrump = $mod.gColourOf[$with.fDrawn];
  };
  this.FinishRound = function (state, Call, made, bonus, counts, signalWinner) {
    var deltas = rtl.arraySetLength(null,0,5);
    var rtotal = rtl.arraySetLength(null,0,5);
    var rtable = rtl.arraySetLength(null,0,5);
    var round = 0;
    var p = 0;
    var q = 0;
    signalWinner.set(false);
    $impl.DeltaOfRound(state,state.fRounds[state.fRound],{get: function () {
        return deltas;
      }, set: function (v) {
        deltas = v;
      }},counts);
    Call.set(state.fRounds[state.fRound].fCall);
    made.set(state.fRounds[state.fRound].fMade);
    bonus.set(state.fRounds[state.fRound].fBonus);
    for (p = 1; p <= 4; p++) {
      if (state.fNextPlayer[p] !== 0) state.fTotal[p] = state.fTotal[p] + deltas[p];
    };
    state.fRoundTotal = state.fRoundTotal + 1;
    state.fRound = state.fRound + 1;
    state.fLeading = state.fNextPlayer[state.fLeading];
    if (state.fRoundTotal >= state.fRules.fRoundLimit) {
      if (state.fRules.fSumUpRanks) {
        for (p = 0; p <= 4; p++) {
          rtotal[p] = 0;
        };
        for (var $l = 0, $end = state.fRound; $l <= $end; $l++) {
          round = $l;
          for (p = 0; p <= 4; p++) {
            if ((p === 0) || (p > state.fRules.fNuPlayers)) {
              deltas[p] = 0;
            } else {
              var $with = state.fRounds[round];
              deltas[p] = $mod.DeltaOf($with.fCall[p],$with.fMade[p],$with.fBonus[p]);
            };
          };
          $mod.TableOf(state.fRules.fNuPlayers,{get: function () {
              return deltas;
            }, set: function (v) {
              deltas = v;
            }},{get: function () {
              return rtable;
            }, set: function (v) {
              rtable = v;
            }});
          for (var $l1 = 1, $end1 = state.fRules.fNuPlayers; $l1 <= $end1; $l1++) {
            p = $l1;
            rtotal[p] = rtotal[p] + rtable[p];
          };
        };
        $mod.TableOf(state.fRules.fNuPlayers,{get: function () {
            return rtotal;
          }, set: function (v) {
            rtotal = v;
          }},{p: state, get: function () {
            return this.p.fFinal;
          }, set: function (v) {
            this.p.fFinal = v;
          }});
      } else {
        $mod.TableOf(state.fRules.fNuPlayers,{p: state, get: function () {
            return this.p.fTotal;
          }, set: function (v) {
            this.p.fTotal = v;
          }},{p: state, get: function () {
            return this.p.fFinal;
          }, set: function (v) {
            this.p.fFinal = v;
          }});
      };
      signalWinner.set(true);
    };
  };
  this.PlayCard = function (state, card) {
    var p = 0;
    var winner = 0;
    var i = 0;
    var $with = state.fRounds[state.fRound];
    var $with1 = $with.fTricks[$with.fTrick];
    p = $with1.fLeading;
    while (($with1.fPlayed[p] !== 0) && (state.fNextPlayer[p] !== $with1.fLeading)) p = state.fNextPlayer[p];
    if ($with1.fPlayed[p] === 0) {
      $with1.fPlayed[p] = card;
    };
    for (i = 0; i <= 11; i++) {
      if (state.fHands[p][i] === card) {
        state.fHands[p][i] = 0;
        break;
      };
    };
    if (state.fNextPlayer[p] === $with.fTricks[$with.fTrick].fLeading) {
      winner = $mod.WinnerOfTrick({p: state, get: function () {
          return this.p.fNextPlayer;
        }, set: function (v) {
          this.p.fNextPlayer = v;
        }},$with.fTrump,$mod.TTrick.$clone($with.fTricks[$with.fTrick]));
      $with.fTrick = $with.fTrick + 1;
      $with.fTricks[$with.fTrick].fLeading = winner;
    };
  };
  this.ForfaitRound = function (state, player) {
    var p = 0;
    var i = rtl.arraySetLength(null,0,5);
    var t = 0;
    var $with = state.fRounds[state.fRound];
    if (($with.fTrick === 0) && ($with.fTricks[0].fLeading === 0)) $with.fTricks[$with.fTrick].fLeading = player;
    for (p = 0; p <= 4; p++) {
      i[p] = 0;
      $with.fCall[p] = 0;
    };
    while ($with.fTrick < state.fTricksHigh) {
      for (var $l = 1, $end = state.fRules.fNuPlayers - 0; $l <= $end; $l++) {
        p = $l;
        if ($with.fTricks[$with.fTrick].fPlayed[p] === 0) {
          while ((i[p] <= 11) && (state.fHands[p][i[p]] === 0)) i[p] = i[p] + 1;
          if (i[p] <= 11) {
            $with.fTricks[$with.fTrick].fPlayed[p] = state.fHands[p][i[p]];
            state.fHands[p][i[p]] = 0;
          };
        };
      };
      p = $mod.WinnerOfTrick({p: state, get: function () {
          return this.p.fNextPlayer;
        }, set: function (v) {
          this.p.fNextPlayer = v;
        }},$with.fTrump,$mod.TTrick.$clone($with.fTricks[$with.fTrick]));
      $with.fCall[p] = $with.fCall[p] + $mod.ValueOfTrick($with.fTrump,$mod.TTrick.$clone($with.fTricks[$with.fTrick]));
      $with.fTrick = $with.fTrick + 1;
      if ($with.fTrick >= state.fTricksHigh) $with.fCall[p] = $with.fCall[p] + 5;
      $with.fTricks[$with.fTrick].fLeading = p;
    };
    $with.fCall[player] = $with.fCall[player] + rtl.trunc(157 / state.fRules.fNuPlayers);
  };
  this.ForfaitJass = function (state, player) {
    var ignore = rtl.arraySetLength(null,0,5);
    var counts = rtl.arraySetLength(null,0,5);
    var signal = false;
    var hands = rtl.arraySetLength(null,0,5,12);
    while (!$mod.MatchFinished(state)) {
      $mod.ForfaitRound(state,player);
      $impl.DeltaOfRound(state,state.fRounds[state.fRound],{get: function () {
          return ignore;
        }, set: function (v) {
          ignore = v;
        }},{get: function () {
          return counts;
        }, set: function (v) {
          counts = v;
        }});
      if (!$mod.MatchFinished(state)) {
        $mod.FinishRound(state,{get: function () {
            return ignore;
          }, set: function (v) {
            ignore = v;
          }},{get: function () {
            return ignore;
          }, set: function (v) {
            ignore = v;
          }},{get: function () {
            return ignore;
          }, set: function (v) {
            ignore = v;
          }},{get: function () {
            return counts;
          }, set: function (v) {
            counts = v;
          }},{get: function () {
            return signal;
          }, set: function (v) {
            signal = v;
          }});
        $mod.DealCards(state.fRules,{get: function () {
            return hands;
          }, set: function (v) {
            hands = v;
          }});
        $mod.PrepareRound(state,$mod.THands$clone(hands),0);
      };
    };
  };
  this.StringOfLong = function (l, width) {
    var Result = "";
    var s = "";
    s = rtl.spaceLeft("" + l,width);
    Result = s;
    return Result;
  };
  this.StringOfReal = function (d, width, leading) {
    var Result = "";
    var s = "";
    if (leading === 0) {
      s = rtl.floatToStr(d,width)}
     else s = rtl.floatToStr(d,width,leading);
    Result = s;
    return Result;
  };
  this.StringToLong = function (s) {
    var Result = 0;
    Result = pas.SysUtils.StrToInt(s);
    return Result;
  };
  this.StringToReal = function (s) {
    var Result = 0.0;
    var r = 0.0;
    var code = 0;
    r = pas.SysUtils.StrToFloat(s);
    Result = r;
    return Result;
  };
  this.LogWrite = function (s) {
    pas.ShellWin.shell.Write(s);
  };
  this.LogWriteLn = function (s) {
    pas.ShellWin.shell.WriteLn(s);
  };
  this.LogChar = function (c) {
    pas.ShellWin.shell.Write(c);
  };
  this.LogLn = function () {
    pas.ShellWin.shell.WriteLn("");
  };
  this.ScrollToEOT = function () {
    pas.ShellWin.shell.GoEOT();
  };
  this.LogReadLn = function (line) {
    pas.ShellWin.shell.ReadLn(line);
  };
  this.NewRnd = function (name) {
    var Result = 0;
    var i = 0;
    Result = 0;
    i = 0;
    while ($mod.gRnd[i].fUsed && (i <= 10)) i = i + 1;
    if (i <= 10) {
      $mod.gRnd[i].fUsed = true;
      $mod.gRnd[i].fName = name;
      $mod.gRnd[i].fSeed = 1;
      Result = i;
    };
    return Result;
  };
  this.SetRnd = function (rndID, seed) {
    if ((rndID > 0) && (rndID <= 10) && $mod.gRnd[rndID].fUsed) {
      $mod.gRnd[rndID].fSeed = seed;
    };
  };
  this.GetRnd = function (rndID) {
    var Result = 0;
    Result = 0;
    if ((rndID > 0) && (rndID <= 10) && $mod.gRnd[rndID].fUsed) {
      Result = $mod.gRnd[rndID].fSeed;
    };
    return Result;
  };
  var A = 16807;
  var M = 2147483647;
  var Q = rtl.trunc(2147483647 / 16807);
  var R = 2147483647 % 16807;
  var hi = 65536;
  var maxint16bit = rtl.trunc(65536 / 2) - 1;
  this.Rnd = function (rndID, absoluteValue) {
    var Result = 0;
    var i = 0;
    Result = 0;
    if ((rndID > 0) && (rndID <= 10) && $mod.gRnd[rndID].fUsed) {
      $mod.gRnd[rndID].fSeed = (16807 * ($mod.gRnd[rndID].fSeed % 127773)) - (2836 * rtl.trunc($mod.gRnd[rndID].fSeed / 127773));
      if ($mod.gRnd[rndID].fSeed <= 0) $mod.gRnd[rndID].fSeed = $mod.gRnd[rndID].fSeed + 2147483647;
      i = rtl.trunc($mod.gRnd[rndID].fSeed / (rtl.trunc(2147483647 / (65536 + 1)) + 1)) - rtl.trunc(65536 / 2);
      if (i < -32767) i = -32767;
      if (absoluteValue && (i < 0)) {
        Result = -i}
       else Result = i;
    };
    return Result;
  };
  this.InitDiffBase = function () {
    var card = 0;
    var prev = 0;
    var colour = 0;
    var trump = 0;
    var rank = 0;
    var i = 0;
    var s = "";
    for (colour = 0; colour <= 4; colour++) {
      for (rank = 0; rank <= 9; rank++) {
        if ((rank === 0) || (colour === 0)) {
          card = 0;
          $mod.gColourOf[card] = 0;
          $mod.gRankOf[card] = 0;
        } else {
          card = (9 * (colour - 1)) + (rank - 1) + 1;
          $mod.gColourOf[card] = colour;
          $mod.gRankOf[card] = rank;
        };
        $mod.gCardOf[colour][rank] = card;
      };
    };
    for (trump = 0; trump <= 4; trump++) for (prev = 0; prev <= 36; prev++) for (card = 0; card <= 36; card++) if (trump === 0) {
      $mod.gBetterCard[trump][prev][card] = false}
     else $mod.gBetterCard[trump][prev][card] = $mod.BetterCard(trump,prev,card);
    for (trump = 0; trump <= 4; trump++) for (card = 0; card <= 36; card++) if (trump === 0) {
      $mod.gValueOfCard[trump][card] = 0}
     else $mod.gValueOfCard[trump][card] = $mod.ValueOfCard(trump,card);
    $mod.gColourName[0] = "NoColour";
    $mod.gColourName[1] = "Schlle";
    $mod.gColourName[2] = "Schilte";
    $mod.gColourName[3] = "Rose";
    $mod.gColourName[4] = "ichle";
    $mod.gRankName[0] = "NoRank";
    $mod.gRankName[1] = "Schsi";
    $mod.gRankName[2] = "Sibni";
    $mod.gRankName[3] = "Achti";
    $mod.gRankName[4] = "Nni";
    $mod.gRankName[5] = "Zni";
    $mod.gRankName[6] = "Bueb";
    $mod.gRankName[7] = "Ober";
    $mod.gRankName[8] = "Knig";
    $mod.gRankName[9] = "Ass";
    for (i = 0; i <= 10; i++) {
      $mod.gRnd[i].fUsed = false;
    };
    $mod.gRnd[0].fUsed = true;
    $mod.gDealRnd = $mod.NewRnd("Verteilen");
    $impl.gRules.fNuPlayers = 4;
    $impl.gRules.fRoundLimit = 16;
    $impl.gRules.fSumUpRanks = false;
    $impl.gRules.fCallMode = 0;
    $impl.gRules.fSCallBonus = false;
    $impl.gRules.fDZeroBonus = 0;
    $impl.gRules.fStockings = 2;
    $mod.gOwnerInfo = "";
    $mod.gVersionInfo = "";
  };
  this.FreeDiffBase = function () {
  };
  $mod.$implcode = function () {
    $impl.gRules = $mod.TRules.$new();
    $impl.DeltaOfRound = function (state, round, deltas, counts) {
      var p = 0;
      var i = 0;
      var total = 0;
      var bonus = 0;
      for (p = 0; p <= 4; p++) {
        deltas.get()[p] = 0;
        counts.get()[p] = 0;
      };
      for (var $l = 0, $end = round.fTrick - 1; $l <= $end; $l++) {
        i = $l;
        p = round.fTricks[i + 1].fLeading;
        if (p !== 0) {
          deltas.get()[p] = deltas.get()[p] + $mod.ValueOfTrick(round.fTrump,$mod.TTrick.$clone(round.fTricks[i]));
          counts.get()[p] = counts.get()[p] + 1;
        };
      };
      if (round.fTrick >= state.fTricksHigh) {
        p = round.fTricks[state.fTricksHigh].fLeading;
        deltas.get()[p] = deltas.get()[p] + 5;
      };
      if (round.fStocksFor !== 0) {
        p = round.fStocksFor;
        if (round.fStockings === 1) {
          deltas.get()[p] = deltas.get()[p] + 20}
         else if (round.fStockings === 2) deltas.get()[p] = deltas.get()[p] - 20;
      };
      round.fMade = deltas.get().slice(0);
      total = 0;
      for (p = 1; p <= 4; p++) {
        if (round.fCall[p] >= 0) {
          total = total + round.fCall[p];
        };
      };
      for (p = 1; p <= 4; p++) {
        if (round.fCall[p] >= 0) {
          if ((Math.abs(deltas.get()[p] - round.fCall[p]) === 0) && (counts.get()[p] > 0) && (state.fRules.fDZeroBonus > 0)) {
            round.fBonus[p] = round.fBonus[p] + state.fRules.fDZeroBonus;
          };
          if (state.fRules.fSCallBonus && (state.fRules.fCallMode === 2) && (p === state.fPrevPlayer[round.fTricks[0].fLeading])) {
            bonus = rtl.trunc(Math.abs(total - 157) / 5);
            round.fBonus[p] = round.fBonus[p] + bonus;
          };
          deltas.get()[p] = $mod.DeltaOf(round.fCall[p],round.fMade[p],round.fBonus[p]);
        };
      };
    };
  };
},["ShellWin","SysUtils"]);
rtl.module("DecOnMac",["System"],function () {
  "use strict";
  var $mod = this;
  this.mColor = 4;
  this.mRank = 9;
  this.mCard = 36;
  this.mPlayer = 4;
  this.mHand = 12;
  this.kAce = 8;
  this.kNell = 7;
  this.kTrumpJack = 8;
  this.kLastTrickValue = 5;
  this.$rtti.$Int("DCard",{minvalue: 0, maxvalue: 35, ordtype: 1});
  this.$rtti.$Int("DColor",{minvalue: 0, maxvalue: 3, ordtype: 1});
  this.$rtti.$Int("DRank",{minvalue: 0, maxvalue: 8, ordtype: 1});
  this.$rtti.$Int("DPlayer",{minvalue: 0, maxvalue: 3, ordtype: 1});
  this.$rtti.$StaticArray("DPlayerSetArray",{dims: [36], eltype: rtl.longint});
  this.$rtti.$StaticArray("DPlayCircle",{dims: [4], eltype: rtl.longint});
  this.$rtti.$StaticArray("DValueOfCard",{dims: [36], eltype: rtl.longint});
  this.$rtti.$StaticArray("DPlayerPoints",{dims: [4], eltype: rtl.longint});
  rtl.recNewT(this,"DHand",function () {
    this.fNum = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fCard = rtl.arraySetLength(null,0,12);
      return r;
    };
    this.$eq = function (b) {
      return (this.fNum === b.fNum) && rtl.arrayEq(this.fCard,b.fCard);
    };
    this.$assign = function (s) {
      this.fNum = s.fNum;
      this.fCard = s.fCard.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("DHand",{},this);
    $r.addField("fNum",rtl.longint);
    $mod.$rtti.$StaticArray("DHand.fCard$a",{dims: [12], eltype: rtl.longint});
    $r.addField("fCard",$mod.$rtti["DHand.fCard$a"]);
  });
  this.$rtti.$Pointer("DHandP",{reftype: this.$rtti["DHand"]});
  this.DHands$clone = function (a) {
    var b = [];
    b.length = 4;
    for (var c = 0; c < 4; c++) b[c] = $mod.DHand.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("DHands",{dims: [4], eltype: this.$rtti["DHand"]});
  rtl.recNewT(this,"DRules",function () {
    this.fNumPlayers = 0;
    this.fBonus = 0;
    this.fBonusNullTrick = 0;
    this.fOpenCalls = false;
    this.fSCallBonus = false;
    this.$new = function () {
      var r = Object.create(this);
      r.fPrevPlayer = rtl.arraySetLength(null,0,4);
      r.fNextPlayer = rtl.arraySetLength(null,0,4);
      return r;
    };
    this.$eq = function (b) {
      return (this.fNumPlayers === b.fNumPlayers) && rtl.arrayEq(this.fPrevPlayer,b.fPrevPlayer) && rtl.arrayEq(this.fNextPlayer,b.fNextPlayer) && (this.fBonus === b.fBonus) && (this.fBonusNullTrick === b.fBonusNullTrick) && (this.fOpenCalls === b.fOpenCalls) && (this.fSCallBonus === b.fSCallBonus);
    };
    this.$assign = function (s) {
      this.fNumPlayers = s.fNumPlayers;
      this.fPrevPlayer = s.fPrevPlayer.slice(0);
      this.fNextPlayer = s.fNextPlayer.slice(0);
      this.fBonus = s.fBonus;
      this.fBonusNullTrick = s.fBonusNullTrick;
      this.fOpenCalls = s.fOpenCalls;
      this.fSCallBonus = s.fSCallBonus;
      return this;
    };
    var $r = $mod.$rtti.$Record("DRules",{},this);
    $r.addField("fNumPlayers",rtl.longint);
    $r.addField("fPrevPlayer",$mod.$rtti["DPlayCircle"]);
    $r.addField("fNextPlayer",$mod.$rtti["DPlayCircle"]);
    $r.addField("fBonus",rtl.longint);
    $r.addField("fBonusNullTrick",rtl.longint);
    $r.addField("fOpenCalls",rtl.boolean);
    $r.addField("fSCallBonus",rtl.boolean);
  });
  this.$rtti.$Pointer("DRulesP",{reftype: this.$rtti["DRules"]});
  rtl.recNewT(this,"DRound",function () {
    $mod.$rtti.$Int("DRound.fNumPlayed$a",{minvalue: 0, maxvalue: 36, ordtype: 1});
    this.fNumPlayed = 0;
    this.fInTrick = 0;
    this.fTrickColor = 0;
    this.fTrickCard = 0;
    this.fTrickOwner = 0;
    this.fTrickPlayer = 0;
    this.fTrickValue = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fPoints = rtl.arraySetLength(null,0,4);
      r.fMadeTrick = rtl.arraySetLength(null,false,4);
      r.fPlayed = rtl.arraySetLength(null,$mod.DHand,4);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fPoints,b.fPoints) && rtl.arrayEq(this.fMadeTrick,b.fMadeTrick) && (this.fNumPlayed === b.fNumPlayed) && (this.fInTrick === b.fInTrick) && rtl.arrayEq(this.fPlayed,b.fPlayed) && (this.fTrickColor === b.fTrickColor) && (this.fTrickCard === b.fTrickCard) && (this.fTrickOwner === b.fTrickOwner) && (this.fTrickPlayer === b.fTrickPlayer) && (this.fTrickValue === b.fTrickValue);
    };
    this.$assign = function (s) {
      this.fPoints = s.fPoints.slice(0);
      this.fMadeTrick = s.fMadeTrick.slice(0);
      this.fNumPlayed = s.fNumPlayed;
      this.fInTrick = s.fInTrick;
      this.fPlayed = $mod.DHands$clone(s.fPlayed);
      this.fTrickColor = s.fTrickColor;
      this.fTrickCard = s.fTrickCard;
      this.fTrickOwner = s.fTrickOwner;
      this.fTrickPlayer = s.fTrickPlayer;
      this.fTrickValue = s.fTrickValue;
      return this;
    };
    var $r = $mod.$rtti.$Record("DRound",{},this);
    $r.addField("fPoints",$mod.$rtti["DPlayerPoints"]);
    $mod.$rtti.$StaticArray("DRound.fMadeTrick$a",{dims: [4], eltype: rtl.boolean});
    $r.addField("fMadeTrick",$mod.$rtti["DRound.fMadeTrick$a"]);
    $r.addField("fNumPlayed",$mod.$rtti["DRound.fNumPlayed$a"]);
    $r.addField("fInTrick",$mod.$rtti["DPlayer"]);
    $r.addField("fPlayed",$mod.$rtti["DHands"]);
    $r.addField("fTrickColor",$mod.$rtti["DColor"]);
    $r.addField("fTrickCard",$mod.$rtti["DCard"]);
    $r.addField("fTrickOwner",$mod.$rtti["DPlayer"]);
    $r.addField("fTrickPlayer",$mod.$rtti["DPlayer"]);
    $r.addField("fTrickValue",rtl.longint);
  });
  this.$rtti.$Pointer("DRoundP",{reftype: this.$rtti["DRound"]});
  rtl.recNewT(this,"TGlobal",function () {
    this.fOpenCard = 0;
    this.fBegins = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fRules = $mod.DRules.$new();
      r.fRound = $mod.DRound.$new();
      r.fTotal = rtl.arraySetLength(null,0,4);
      r.fLevel = rtl.arraySetLength(null,0,4);
      return r;
    };
    this.$eq = function (b) {
      return this.fRules.$eq(b.fRules) && this.fRound.$eq(b.fRound) && (this.fOpenCard === b.fOpenCard) && (this.fBegins === b.fBegins) && rtl.arrayEq(this.fTotal,b.fTotal) && rtl.arrayEq(this.fLevel,b.fLevel);
    };
    this.$assign = function (s) {
      this.fRules.$assign(s.fRules);
      this.fRound.$assign(s.fRound);
      this.fOpenCard = s.fOpenCard;
      this.fBegins = s.fBegins;
      this.fTotal = s.fTotal.slice(0);
      this.fLevel = s.fLevel.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("TGlobal",{},this);
    $r.addField("fRules",$mod.$rtti["DRules"]);
    $r.addField("fRound",$mod.$rtti["DRound"]);
    $r.addField("fOpenCard",$mod.$rtti["DCard"]);
    $r.addField("fBegins",$mod.$rtti["DPlayer"]);
    $r.addField("fTotal",$mod.$rtti["DPlayerPoints"]);
    $mod.$rtti.$StaticArray("TGlobal.fLevel$a",{dims: [4], eltype: rtl.longint});
    $r.addField("fLevel",$mod.$rtti["TGlobal.fLevel$a"]);
  });
  this.$rtti.$Pointer("TGlobalP",{reftype: this.$rtti["TGlobal"]});
  rtl.recNewT(this,"TLocal",function () {
    this.fPlayer = 0;
    this.fPrivate = null;
    this.$new = function () {
      var r = Object.create(this);
      r.fMayHave = rtl.arraySetLength(null,0,36);
      r.fHandDealt = $mod.DHand.$new();
      r.fHand = $mod.DHand.$new();
      r.fLegal = $mod.DHand.$new();
      r.fCall = rtl.arraySetLength(null,0,4);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fMayHave,b.fMayHave) && (this.fPlayer === b.fPlayer) && this.fHandDealt.$eq(b.fHandDealt) && this.fHand.$eq(b.fHand) && this.fLegal.$eq(b.fLegal) && rtl.arrayEq(this.fCall,b.fCall) && (this.fPrivate === b.fPrivate);
    };
    this.$assign = function (s) {
      this.fMayHave = s.fMayHave.slice(0);
      this.fPlayer = s.fPlayer;
      this.fHandDealt.$assign(s.fHandDealt);
      this.fHand.$assign(s.fHand);
      this.fLegal.$assign(s.fLegal);
      this.fCall = s.fCall.slice(0);
      this.fPrivate = s.fPrivate;
      return this;
    };
    var $r = $mod.$rtti.$Record("TLocal",{},this);
    $r.addField("fMayHave",$mod.$rtti["DPlayerSetArray"]);
    $r.addField("fPlayer",$mod.$rtti["DPlayer"]);
    $r.addField("fHandDealt",$mod.$rtti["DHand"]);
    $r.addField("fHand",$mod.$rtti["DHand"]);
    $r.addField("fLegal",$mod.$rtti["DHand"]);
    $r.addField("fCall",$mod.$rtti["DPlayerPoints"]);
    $r.addField("fPrivate",rtl.pointer);
  });
  this.$rtti.$Pointer("TLocalP",{reftype: this.$rtti["TLocal"]});
  rtl.recNewT(this,"TJasserParam",function () {
    this.fGlobal = null;
    this.fLocal = null;
    this.$eq = function (b) {
      return (this.fGlobal === b.fGlobal) && (this.fLocal === b.fLocal);
    };
    this.$assign = function (s) {
      this.fGlobal = s.fGlobal;
      this.fLocal = s.fLocal;
      return this;
    };
    var $r = $mod.$rtti.$Record("TJasserParam",{},this);
    $r.addField("fGlobal",$mod.$rtti["TGlobalP"]);
    $r.addField("fLocal",$mod.$rtti["TLocalP"]);
  });
  this.$rtti.$Pointer("TJasserParamP",{reftype: this.$rtti["TJasserParam"]});
  this.$rtti.$StaticArray("pColorOf$a",{dims: [36], eltype: this.$rtti["DColor"]});
  this.pColorOf = rtl.arraySetLength(null,0,36);
  this.pValueOfCard = rtl.arraySetLength(null,0,36);
  this.$rtti.$StaticArray("pRankOf$a",{dims: [36], eltype: this.$rtti["DRank"]});
  this.pRankOf = rtl.arraySetLength(null,0,36);
  this.$rtti.$StaticArray("pNumCardsNumPlayers$a",{dims: [5], eltype: rtl.longint});
  this.pNumCardsNumPlayers = rtl.arraySetLength(null,0,5);
  this.$rtti.$StaticArray("pBit$a",{dims: [10], eltype: rtl.longint});
  this.pBit = rtl.arraySetLength(null,0,10);
  this.$rtti.$StaticArray("pThree$a",{dims: [10], eltype: rtl.longint});
  this.pThree = rtl.arraySetLength(null,0,10);
  this.$rtti.$StaticArray("pSetToPlayer$a",{dims: [9], eltype: rtl.longint});
  this.pSetToPlayer = rtl.arraySetLength(null,0,9);
  this.pPrintCard = false;
  this.CardOf = function (col, rank) {
    var Result = 0;
    Result = (col * 9) + rank;
    return Result;
  };
  this.IsTrump = function (c) {
    var Result = false;
    Result = $mod.pColorOf[c] === 0;
    return Result;
  };
  this.PBetterCard = function (This, prev) {
    var Result = false;
    if ($mod.pColorOf[This] === $mod.pColorOf[prev]) {
      Result = This > prev}
     else Result = $mod.IsTrump(This) && !$mod.IsTrump(prev);
    return Result;
  };
  this.AllowedCard = function (This, prev, trickColor) {
    var Result = false;
    var col = 0;
    col = $mod.pColorOf[This];
    Result = (col === trickColor) || ((col === 0) && (($mod.pColorOf[prev] !== 0) || (This > prev)));
    return Result;
  };
  this.AllLegal = function (hand, numPlayed, numPlayers, trickColor) {
    var Result = false;
    var i = 0;
    if ((numPlayed % numPlayers) === 0) {
      Result = true;
      return Result;
    } else {
      for (var $l = 0, $end = hand.fNum - 1; $l <= $end; $l++) {
        i = $l;
        if (($mod.pColorOf[hand.fCard[i]] === trickColor) && (hand.fCard[i] !== 8)) {
          Result = false;
          return Result;
        };
      };
    };
    Result = true;
    return Result;
  };
  this.InitDEConMAC = function () {
    var card = 0;
    var colour = 0;
    var i = 0;
    for (card = 0; card <= 35; card++) {
      $mod.pColorOf[card] = rtl.trunc(card / 9);
      $mod.pRankOf[card] = card % 9;
      $mod.pValueOfCard[card] = 0;
      colour = $mod.pColorOf[card];
      var $tmp = $mod.pRankOf[card] + 1;
      if (($tmp === 1) || ($tmp === 2) || ($tmp === 3)) {
        $mod.pValueOfCard[card] = 0}
       else if ($tmp === 4) {
        if (colour === 0) {
          $mod.pValueOfCard[card] = 10}
         else $mod.pValueOfCard[card] = 0}
       else if ($tmp === 5) {
        if (colour === 0) {
          $mod.pValueOfCard[card] = 3}
         else $mod.pValueOfCard[card] = 10}
       else if ($tmp === 6) {
        if (colour === 0) {
          $mod.pValueOfCard[card] = 4}
         else $mod.pValueOfCard[card] = 2}
       else if ($tmp === 7) {
        if (colour === 0) {
          $mod.pValueOfCard[card] = 11}
         else $mod.pValueOfCard[card] = 3}
       else if ($tmp === 8) {
        if (colour === 0) {
          $mod.pValueOfCard[card] = 14}
         else $mod.pValueOfCard[card] = 4}
       else if ($tmp === 9) if (colour === 0) {
        $mod.pValueOfCard[card] = 20}
       else $mod.pValueOfCard[card] = 11;
    };
    $mod.pBit[0] = 1;
    for (i = 1; i <= 9; i++) $mod.pBit[i] = $mod.pBit[i - 1] * 2;
    $mod.pThree[0] = 1;
    for (i = 1; i <= 9; i++) $mod.pThree[i] = $mod.pThree[i - 1] * 3;
    $mod.pSetToPlayer[0] = -1;
    $mod.pSetToPlayer[1] = 0;
    $mod.pSetToPlayer[2] = 1;
    $mod.pSetToPlayer[3] = -1;
    $mod.pSetToPlayer[4] = 2;
    $mod.pSetToPlayer[5] = -1;
    $mod.pSetToPlayer[6] = -1;
    $mod.pSetToPlayer[7] = -1;
    $mod.pSetToPlayer[8] = 3;
  };
},["DiffBase"]);
rtl.module("DiffCmds",["System","DiffBase"],function () {
  "use strict";
  var $mod = this;
  this.cmdError = -1;
  this.cmdEmpty = 0;
  this.cmdDummy = 1;
  this.cmdClose = 1000;
  this.cmdConnect = 1001;
  this.cmdDisconnect = 1002;
  this.cmdNew = 1100;
  this.cmdRestart = 1101;
  this.cmdAutoPlay = 1102;
  this.cmdStopPlay = 1103;
  this.cmdRemotePlay = 1104;
  this.cmdRemoteLast = 1105;
  this.cmdRemoteDone = 1106;
  this.cmdDeal = 2000;
  this.cmdEdit = 2001;
  this.cmdCall = 2002;
  this.cmdPlay = 2003;
  this.cmdCard = 2004;
  this.cmdCount = 2005;
  this.cmdForfaitRound = 2006;
  this.cmdForfaitJass = 2007;
  this.cmdStockings = 2008;
  this.cmdWinner = 2010;
  this.cmdSay = 2020;
  this.errFatal = -1;
  this.errMisc = 0;
  this.errInfo = 0;
  this.kCmdHigh = 49;
  this.kMinLevel = 0;
  this.kMaxLevel = 99;
  this.kTicksPerSecond = 60;
  rtl.recNewT(this,"TCommand",function () {
    this.fCmdID = 0;
    this.fCData = null;
    this.$eq = function (b) {
      return (this.fCmdID === b.fCmdID) && (this.fCData === b.fCData);
    };
    this.$assign = function (s) {
      this.fCmdID = s.fCmdID;
      this.fCData = s.fCData;
      return this;
    };
    var $r = $mod.$rtti.$Record("TCommand",{},this);
    $r.addField("fCmdID",rtl.longint);
    $r.addField("fCData",rtl.pointer);
  });
  rtl.recNewT(this,"ErrorData",function () {
    this.fErrorID = 0;
    this.fMessage = "";
    this.$eq = function (b) {
      return (this.fErrorID === b.fErrorID) && (this.fMessage === b.fMessage);
    };
    this.$assign = function (s) {
      this.fErrorID = s.fErrorID;
      this.fMessage = s.fMessage;
      return this;
    };
    var $r = $mod.$rtti.$Record("ErrorData",{},this);
    $r.addField("fErrorID",rtl.longint);
    $r.addField("fMessage",rtl.string);
  });
  this.$rtti.$Pointer("ErrorCmd",{reftype: this.$rtti["ErrorData"]});
  rtl.recNewT(this,"ConnectData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fPlayers = {};
      r.fTypes = rtl.arraySetLength(null,0,5);
      r.fNames = rtl.arraySetLength(null,"",5);
      r.fLevel = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return rtl.eqSet(this.fPlayers,b.fPlayers) && rtl.arrayEq(this.fTypes,b.fTypes) && rtl.arrayEq(this.fNames,b.fNames) && rtl.arrayEq(this.fLevel,b.fLevel);
    };
    this.$assign = function (s) {
      this.fPlayers = rtl.refSet(s.fPlayers);
      this.fTypes = s.fTypes.slice(0);
      this.fNames = s.fNames.slice(0);
      this.fLevel = s.fLevel.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("ConnectData",{},this);
    $r.addField("fPlayers",pas.DiffBase.$rtti["TPlayerSet"]);
    $mod.$rtti.$StaticArray("ConnectData.fTypes$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fTypes",$mod.$rtti["ConnectData.fTypes$a"]);
    $mod.$rtti.$StaticArray("ConnectData.fNames$a",{dims: [5], eltype: rtl.string});
    $r.addField("fNames",$mod.$rtti["ConnectData.fNames$a"]);
    $mod.$rtti.$StaticArray("ConnectData.fLevel$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fLevel",$mod.$rtti["ConnectData.fLevel$a"]);
  });
  this.$rtti.$Pointer("ConnectCmd",{reftype: this.$rtti["ConnectData"]});
  rtl.recNewT(this,"DisconnectData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fPlayers = {};
      return r;
    };
    this.$eq = function (b) {
      return rtl.eqSet(this.fPlayers,b.fPlayers);
    };
    this.$assign = function (s) {
      this.fPlayers = rtl.refSet(s.fPlayers);
      return this;
    };
    var $r = $mod.$rtti.$Record("DisconnectData",{},this);
    $r.addField("fPlayers",pas.DiffBase.$rtti["TPlayerSet"]);
  });
  this.$rtti.$Pointer("DisconnectCmd",{reftype: this.$rtti["DisconnectData"]});
  rtl.recNewT(this,"NewData",function () {
    this.fPlayer = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fRules = pas.DiffBase.TRules.$new();
      r.fTypes = rtl.arraySetLength(null,0,5);
      r.fNames = rtl.arraySetLength(null,"",5);
      r.fLevel = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return this.fRules.$eq(b.fRules) && rtl.arrayEq(this.fTypes,b.fTypes) && rtl.arrayEq(this.fNames,b.fNames) && rtl.arrayEq(this.fLevel,b.fLevel) && (this.fPlayer === b.fPlayer);
    };
    this.$assign = function (s) {
      this.fRules.$assign(s.fRules);
      this.fTypes = s.fTypes.slice(0);
      this.fNames = s.fNames.slice(0);
      this.fLevel = s.fLevel.slice(0);
      this.fPlayer = s.fPlayer;
      return this;
    };
    var $r = $mod.$rtti.$Record("NewData",{},this);
    $r.addField("fRules",pas.DiffBase.$rtti["TRules"]);
    $mod.$rtti.$StaticArray("NewData.fTypes$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fTypes",$mod.$rtti["NewData.fTypes$a"]);
    $mod.$rtti.$StaticArray("NewData.fNames$a",{dims: [5], eltype: rtl.string});
    $r.addField("fNames",$mod.$rtti["NewData.fNames$a"]);
    $mod.$rtti.$StaticArray("NewData.fLevel$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fLevel",$mod.$rtti["NewData.fLevel$a"]);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
  });
  this.$rtti.$Pointer("NewCmd",{reftype: this.$rtti["NewData"]});
  rtl.recNewT(this,"AutoPlayData",function () {
    this.fJasses = 0;
    this.$eq = function (b) {
      return this.fJasses === b.fJasses;
    };
    this.$assign = function (s) {
      this.fJasses = s.fJasses;
      return this;
    };
    var $r = $mod.$rtti.$Record("AutoPlayData",{},this);
    $r.addField("fJasses",rtl.longint);
  });
  this.$rtti.$Pointer("AutoPlayCmd",{reftype: this.$rtti["AutoPlayData"]});
  rtl.recNewT(this,"DealData",function () {
    this.fDrawn = 0;
    this.fDrawnFor = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fHands = rtl.arraySetLength(null,0,5,12);
      r.fTotal = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return (this.fDrawn === b.fDrawn) && (this.fDrawnFor === b.fDrawnFor) && rtl.arrayEq(this.fHands,b.fHands) && rtl.arrayEq(this.fTotal,b.fTotal);
    };
    this.$assign = function (s) {
      this.fDrawn = s.fDrawn;
      this.fDrawnFor = s.fDrawnFor;
      this.fHands = pas.DiffBase.THands$clone(s.fHands);
      this.fTotal = s.fTotal.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("DealData",{},this);
    $r.addField("fDrawn",pas.DiffBase.$rtti["TCard"]);
    $r.addField("fDrawnFor",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fHands",pas.DiffBase.$rtti["THands"]);
    $r.addField("fTotal",pas.DiffBase.$rtti["TDeltas"]);
  });
  this.$rtti.$Pointer("DealCmd",{reftype: this.$rtti["DealData"]});
  rtl.recNewT(this,"EditData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fHands = rtl.arraySetLength(null,0,5,12);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fHands,b.fHands);
    };
    this.$assign = function (s) {
      this.fHands = pas.DiffBase.THands$clone(s.fHands);
      return this;
    };
    var $r = $mod.$rtti.$Record("EditData",{},this);
    $r.addField("fHands",pas.DiffBase.$rtti["THands"]);
  });
  this.$rtti.$Pointer("EditCmd",{reftype: this.$rtti["EditData"]});
  rtl.recNewT(this,"CallData",function () {
    this.fPlayer = 0;
    this.fCall = 0;
    this.$eq = function (b) {
      return (this.fPlayer === b.fPlayer) && (this.fCall === b.fCall);
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      this.fCall = s.fCall;
      return this;
    };
    var $r = $mod.$rtti.$Record("CallData",{},this);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fCall",rtl.longint);
  });
  this.$rtti.$Pointer("CallCmd",{reftype: this.$rtti["CallData"]});
  rtl.recNewT(this,"CardData",function () {
    this.fPlayer = 0;
    this.fCard = 0;
    this.$eq = function (b) {
      return (this.fPlayer === b.fPlayer) && (this.fCard === b.fCard);
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      this.fCard = s.fCard;
      return this;
    };
    var $r = $mod.$rtti.$Record("CardData",{},this);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fCard",pas.DiffBase.$rtti["TCard"]);
  });
  this.$rtti.$Pointer("CardCmd",{reftype: this.$rtti["CardData"]});
  rtl.recNewT(this,"StockingsData",function () {
    this.fPlayer = 0;
    this.fStockings = 0;
    this.$eq = function (b) {
      return (this.fPlayer === b.fPlayer) && (this.fStockings === b.fStockings);
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      this.fStockings = s.fStockings;
      return this;
    };
    var $r = $mod.$rtti.$Record("StockingsData",{},this);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fStockings",rtl.longint);
  });
  this.$rtti.$Pointer("StockingsCmd",{reftype: this.$rtti["StockingsData"]});
  rtl.recNewT(this,"PlayData",function () {
    this.fTrump = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTrick = pas.DiffBase.TTrick.$new();
      r.fHand = rtl.arraySetLength(null,0,12);
      r.fLegal = rtl.arraySetLength(null,0,12);
      return r;
    };
    this.$eq = function (b) {
      return (this.fTrump === b.fTrump) && this.fTrick.$eq(b.fTrick) && rtl.arrayEq(this.fHand,b.fHand) && rtl.arrayEq(this.fLegal,b.fLegal);
    };
    this.$assign = function (s) {
      this.fTrump = s.fTrump;
      this.fTrick.$assign(s.fTrick);
      this.fHand = s.fHand.slice(0);
      this.fLegal = s.fLegal.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("PlayData",{},this);
    $r.addField("fTrump",pas.DiffBase.$rtti["TTrump"]);
    $r.addField("fTrick",pas.DiffBase.$rtti["TTrick"]);
    $r.addField("fHand",pas.DiffBase.$rtti["THand"]);
    $r.addField("fLegal",pas.DiffBase.$rtti["THand"]);
  });
  this.$rtti.$Pointer("PlayCmd",{reftype: this.$rtti["PlayData"]});
  rtl.recNewT(this,"CountData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fCall = rtl.arraySetLength(null,0,5);
      r.fMade = rtl.arraySetLength(null,0,5);
      r.fBonus = rtl.arraySetLength(null,0,5);
      r.fCounts = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fCall,b.fCall) && rtl.arrayEq(this.fMade,b.fMade) && rtl.arrayEq(this.fBonus,b.fBonus) && rtl.arrayEq(this.fCounts,b.fCounts);
    };
    this.$assign = function (s) {
      this.fCall = s.fCall.slice(0);
      this.fMade = s.fMade.slice(0);
      this.fBonus = s.fBonus.slice(0);
      this.fCounts = s.fCounts.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("CountData",{},this);
    $r.addField("fCall",pas.DiffBase.$rtti["TDeltas"]);
    $r.addField("fMade",pas.DiffBase.$rtti["TDeltas"]);
    $r.addField("fBonus",pas.DiffBase.$rtti["TDeltas"]);
    $r.addField("fCounts",pas.DiffBase.$rtti["TCounts"]);
  });
  this.$rtti.$Pointer("CountCmd",{reftype: this.$rtti["CountData"]});
  rtl.recNewT(this,"ForfaitData",function () {
    this.fPlayer = 0;
    this.$eq = function (b) {
      return this.fPlayer === b.fPlayer;
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      return this;
    };
    var $r = $mod.$rtti.$Record("ForfaitData",{},this);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
  });
  this.$rtti.$Pointer("ForfaitCmd",{reftype: this.$rtti["ForfaitData"]});
  rtl.recNewT(this,"WinnerData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fTable = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fTable,b.fTable);
    };
    this.$assign = function (s) {
      this.fTable = s.fTable.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("WinnerData",{},this);
    $r.addField("fTable",pas.DiffBase.$rtti["TTable"]);
  });
  this.$rtti.$Pointer("WinnerCmd",{reftype: this.$rtti["WinnerData"]});
  this.MOODINFO = {"0": "moodFurious", moodFurious: 0, "1": "moodAngry", moodAngry: 1, "2": "moodCalm", moodCalm: 2, "3": "moodHappy", moodHappy: 3, "4": "moodOverjoyed", moodOverjoyed: 4};
  this.$rtti.$Enum("MOODINFO",{minvalue: 0, maxvalue: 4, ordtype: 1, enumtype: this.MOODINFO});
  rtl.recNewT(this,"SayData",function () {
    this.fFrom = 0;
    this.fMood = 0;
    this.fText = "";
    this.fIcon = 0;
    this.fSayID = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTo = {};
      return r;
    };
    this.$eq = function (b) {
      return (this.fFrom === b.fFrom) && rtl.eqSet(this.fTo,b.fTo) && (this.fMood === b.fMood) && (this.fText === b.fText) && (this.fIcon === b.fIcon) && (this.fSayID === b.fSayID);
    };
    this.$assign = function (s) {
      this.fFrom = s.fFrom;
      this.fTo = rtl.refSet(s.fTo);
      this.fMood = s.fMood;
      this.fText = s.fText;
      this.fIcon = s.fIcon;
      this.fSayID = s.fSayID;
      return this;
    };
    var $r = $mod.$rtti.$Record("SayData",{},this);
    $r.addField("fFrom",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fTo",pas.DiffBase.$rtti["TPlayerSet"]);
    $r.addField("fMood",$mod.$rtti["MOODINFO"]);
    $r.addField("fText",rtl.string);
    $r.addField("fIcon",rtl.longint);
    $r.addField("fSayID",rtl.longint);
  });
  this.$rtti.$Pointer("SayCmd",{reftype: this.$rtti["SayData"]});
  this.InitCommand = function (aCmd, cmdID) {
    var pNew = null;
    var pDeal = null;
    var pEdit = null;
    var pCall = null;
    var pCard = null;
    var pStockings = null;
    var pPlay = null;
    var pCount = null;
    var pWinner = null;
    var pSay = null;
    aCmd.fCmdID = cmdID;
    aCmd.fCData = null;
    var $tmp = cmdID;
    if ($tmp === 1100) {
      pNew = $mod.NewData.$new();
      aCmd.fCData = pNew;
    } else if ($tmp === 2000) {
      pDeal = $mod.DealData.$new();
      aCmd.fCData = pDeal;
    } else if ($tmp === 2001) {
      pEdit = $mod.EditData.$new();
      aCmd.fCData = pEdit;
    } else if ($tmp === 2002) {
      pCall = $mod.CallData.$new();
      aCmd.fCData = pCall;
    } else if ($tmp === 2004) {
      pCard = $mod.CardData.$new();
      aCmd.fCData = pCard;
    } else if ($tmp === 2008) {
      pStockings = $mod.StockingsData.$new();
      aCmd.fCData = pStockings;
    } else if ($tmp === 2003) {
      pPlay = $mod.PlayData.$new();
      aCmd.fCData = pPlay;
    } else if ($tmp === 2005) {
      pCount = $mod.CountData.$new();
      aCmd.fCData = pCount;
    } else if ($tmp === 2010) {
      pWinner = $mod.WinnerData.$new();
      aCmd.fCData = pWinner;
    } else if ($tmp === 2020) {
      pSay = $mod.SayData.$new();
      aCmd.fCData = pSay;
    };
  };
  this.FreeCommand = function (aCmd) {
    aCmd.fCData = null;
    aCmd.fCmdID = 0;
  };
});
rtl.module("DiffNet",["System"],function () {
  "use strict";
  var $mod = this;
});
rtl.module("DiffPlay",["System","DiffBase","DiffCmds"],function () {
  "use strict";
  var $mod = this;
  this.kHumanJasser = 0;
  this.kHTabHigh = 9;
  rtl.createClass(this,"TJassHandler",pas.System.TObject,function () {
    this.$init = function () {
      pas.System.TObject.$init.call(this);
      this.fPlayer = 0;
      this.fLevel = 0;
    };
    this.IJassHandler = function (player) {
      this.fPlayer = player;
      this.fLevel = 99;
      return this;
    };
    this.NewInstance = function (player) {
      var Result = null;
      Result = $mod.TJassHandler.$create("IJassHandler",[player]);
      return Result;
    };
    this.Edit = function () {
    };
    this.About = function () {
    };
    this.HandleRequest = function (aReq, answer) {
      pas.DiffCmds.InitCommand(answer,0);
    };
    this.NotifyCommand = function (aCmd) {
      if (aCmd.fCmdID === 1100) {
        this.fPlayer = aCmd.fCData.fPlayer;
        this.fLevel = aCmd.fCData.fLevel[this.fPlayer];
      };
    };
    this.Free$1 = function () {
    };
  });
  this.PortHandler = null;
  this.DeclareHandler = function (handler, name) {
    $mod.PortHandler = handler;
  };
});
rtl.module("Jassers",["System","DiffBase","DiffCmds","DiffPlay"],function () {
  "use strict";
  var $mod = this;
  rtl.createClass(this,"TProtoJasser",pas.DiffPlay.TJassHandler,function () {
    this.$init = function () {
      pas.DiffPlay.TJassHandler.$init.call(this);
      this.fRules = pas.DiffBase.TRules.$new();
      this.fMyHand = rtl.arraySetLength(null,0,12);
      this.fMyName = "";
      this.fSayMood = 0;
      this.fSayIcon = 0;
    };
    this.$final = function () {
      this.fRules = undefined;
      this.fMyHand = undefined;
      pas.DiffPlay.TJassHandler.$final.call(this);
    };
    this.IJassHandler$1 = function (player) {
      pas.DiffPlay.TJassHandler.IJassHandler.call(this,player);
      pas.DiffBase.GetGlobalRules(this.fRules);
      return this;
    };
    this.NotifyCommand = function (aCmd) {
      var c = 0;
      pas.DiffPlay.TJassHandler.NotifyCommand.call(this,pas.DiffCmds.TCommand.$clone(aCmd));
      var $tmp = aCmd.fCmdID;
      if ($tmp === 1100) {
        this.fRules.$assign(aCmd.fCData.fRules);
        this.fMyName = aCmd.fCData.fNames[this.fPlayer];
      } else if ($tmp === 2000) {
        this.fMyHand = aCmd.fCData.fHands[this.fPlayer].slice(0);
        pas.DiffBase.SortHand({p: this, get: function () {
            return this.p.fMyHand;
          }, set: function (v) {
            this.p.fMyHand = v;
          }});
      } else if ($tmp === 2001) {
        this.fMyHand = aCmd.fCData.fHands[this.fPlayer].slice(0);
        pas.DiffBase.SortHand({p: this, get: function () {
            return this.p.fMyHand;
          }, set: function (v) {
            this.p.fMyHand = v;
          }});
      } else if ($tmp === 2004) if (aCmd.fCData.fPlayer === this.fPlayer) for (c = 0; c <= 11; c++) if (this.fMyHand[c] === aCmd.fCData.fCard) this.fMyHand[c] = 0;
    };
  });
});
rtl.module("ResUtils",["System"],function () {
  "use strict";
  var $mod = this;
});
rtl.module("WinFile",["System"],function () {
  "use strict";
  var $mod = this;
  this.kNoFile = 0;
  this.CloseWinFile = function (f) {
  };
});
rtl.module("Dialogs",["System"],function () {
  "use strict";
  var $mod = this;
  this.ShowMessage = function (s) {
    pas.System.Writeln(s);
  };
});
rtl.module("PcFiles",["System"],function () {
  "use strict";
  var $mod = this;
  this.GetDataPath = function () {
    var Result = "";
    Result = "";
    return Result;
  };
});
rtl.module("RGLearn",["System","DecOnMac","DiffBase","ResUtils"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.endgame = 26;
  this.NumValues = 55350;
  this.$rtti.$StaticArray("DIsPlayer",{dims: [4], eltype: rtl.boolean});
  this.$rtti.$StaticArray("DLevel",{dims: [4], eltype: rtl.longint});
  this.$rtti.$StaticArray("TPointArray",{dims: [4], eltype: rtl.longint});
  rtl.recNewT(this,"TPortRecord0",function () {
    this.loAvg = 0.0;
    this.hiAvg = 0.0;
    this.hiOff = 0.0;
    this.loCnt = 0;
    this.hiCnt = 0;
    this.$eq = function (b) {
      return (this.loAvg === b.loAvg) && (this.hiAvg === b.hiAvg) && (this.hiOff === b.hiOff) && (this.loCnt === b.loCnt) && (this.hiCnt === b.hiCnt);
    };
    this.$assign = function (s) {
      this.loAvg = s.loAvg;
      this.hiAvg = s.hiAvg;
      this.hiOff = s.hiOff;
      this.loCnt = s.loCnt;
      this.hiCnt = s.hiCnt;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord0",{},this);
    $r.addField("loAvg",pas.System.$rtti["Real"]);
    $r.addField("hiAvg",pas.System.$rtti["Real"]);
    $r.addField("hiOff",pas.System.$rtti["Real"]);
    $r.addField("loCnt",rtl.longint);
    $r.addField("hiCnt",rtl.longint);
  });
  rtl.recNewT(this,"TPortRecord1",function () {
    this.coloravg = 0.0;
    this.restavg = 0.0;
    this.cnt = 0;
    this.$eq = function (b) {
      return (this.coloravg === b.coloravg) && (this.restavg === b.restavg) && (this.cnt === b.cnt);
    };
    this.$assign = function (s) {
      this.coloravg = s.coloravg;
      this.restavg = s.restavg;
      this.cnt = s.cnt;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord1",{},this);
    $r.addField("coloravg",pas.System.$rtti["Real"]);
    $r.addField("restavg",pas.System.$rtti["Real"]);
    $r.addField("cnt",rtl.longint);
  });
  this.$rtti.$DynArray("TPortData",{eltype: rtl.byte});
  this.PortData = [];
  this.BidValues$a$clone = function (a) {
    var b = [];
    b.length = 158;
    for (var c = 0; c < 158; c++) b[c] = $mod.TPortRecord0.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("BidValues$a",{dims: [158], eltype: this.$rtti["TPortRecord0"]});
  this.BidValues = rtl.arraySetLength(null,this.TPortRecord0,158);
  this.CardValues$a$clone = function (a) {
    var b = [];
    b.length = 55350;
    for (var c = 0; c < 55350; c++) b[c] = $mod.TPortRecord1.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("CardValues$a",{dims: [55350], eltype: this.$rtti["TPortRecord1"]});
  this.CardValues = rtl.arraySetLength(null,this.TPortRecord1,55350);
  this.rate = 1024;
  this.$rtti.$StaticArray("HiAllProb$a",{dims: [1023], eltype: pas.System.$rtti["Real"]});
  this.LoNoneProb = rtl.arraySetLength(null,0.0,1023);
  this.HiNoneProb = rtl.arraySetLength(null,0.0,1023);
  this.LoAllProb = rtl.arraySetLength(null,0.0,1023);
  this.HiAllProb = rtl.arraySetLength(null,0.0,1023);
  this.PlayProb$a$clone = function (a) {
    var b = [];
    b.length = 8;
    for (var c = 0; c < 8; c++) {
      var d = b[c] = [];
      d.length = 6;
      var e = a[c];
      for (var f = 0; f < 6; f++) {
        var g = d[f] = [];
        g.length = 2;
        var h = e[f];
        for (var i = 0; i < 2; i++) g[i] = h[i].slice(0);
      };
    };
    return b;
  };
  this.$rtti.$StaticArray("PlayProb$a",{dims: [8,6,2,130], eltype: pas.System.$rtti["Real"]});
  this.PlayProb = rtl.arraySetLength(null,0.0,8,6,2,130);
  this.binom$a$clone = function (a) {
    var b = [];
    b.length = 10;
    for (var c = 0; c < 10; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("binom$a",{dims: [10,10], eltype: rtl.longint});
  this.binom = rtl.arraySetLength(null,0,10,10);
  this.kCallType = "rugD";
  this.krgRsrc = 9000;
  this.krgStrings = 9000;
  this.krgIcons = 9100;
  this.grgRnd = 0;
  this.grgRes = 0;
  this.InitLearnValues = function () {
    var datafinal = rtl.arraySetLength(null,0,366824);
    var cur = 0;
    var outdata = 0;
    var data = 0;
    var data2 = 0;
    var cavg = 0;
    var ravg = 0;
    var loavg = 0;
    var hiavg = 0;
    var hiOff = 0;
    var cnt = 0;
    var i = 0;
    var j = 0;
    var k = 0;
    var index = 0;
    var cards = rtl.arraySetLength(null,0,9);
    var ingame = {};
    var playercards = {};
    var wantmore = false;
    var dummy = false;
    var count = 0;
    var realcol = 0.0;
    var realres = 0.0;
    var MyHave = rtl.arraySetLength(null,0,36);
    var where = 0;
    var certain = 0;
    var bal = 0;
    var tIndex = 0;
    var nIndex = 0;
    var stichindex = 0;
    var lo = 0.0;
    var hi = 0.0;
    var saveRes = 0;
    var f = 0;
    var ignore = false;
    for (i = 0; i <= 9; i++) {
      $mod.binom[i][0] = 1;
      $mod.binom[i][i] = 1;
    };
    for (i = 2; i <= 9; i++) for (var $l = 1, $end = i - 1; $l <= $end; $l++) {
      j = $l;
      $mod.binom[i][j] = $mod.binom[i - 1][j - 1] + $mod.binom[i - 1][j];
    };
    for (index = 0; index <= 366823; index++) datafinal[index] = $mod.PortData[index];
    cur = 0;
    for (i = 0; i <= 55349; i++) {
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.CardValues[i].coloravg = outdata / 256;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.CardValues[i].restavg = outdata / 256;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.CardValues[i].cnt = outdata;
    };
    for (i = 0; i <= 1022; i++) {
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.LoNoneProb[i] = outdata / 65535;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.LoAllProb[i] = outdata / 65535;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.HiNoneProb[i] = outdata / 65535;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.HiAllProb[i] = outdata / 65535;
    };
    for (i = 1; i <= 8; i++) for (j = 0; j <= 5; j++) for (k = 0; k <= 129; k++) {
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.PlayProb[i - 1][j][0][k] = outdata / 65535;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.PlayProb[i - 1][j][1][k] = outdata / 65535;
    };
    for (i = 0; i <= 157; i++) {
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.BidValues[i].loAvg = outdata / 256;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.BidValues[i].hiAvg = outdata / 256;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.BidValues[i].hiOff = (outdata / 256) - 128;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.BidValues[i].loCnt = outdata;
      outdata = datafinal[cur];
      outdata = (256 * outdata) + datafinal[cur + 1];
      cur = cur + 2;
      $mod.BidValues[i].hiCnt = outdata;
    };
    j = rtl.trunc(55350 / 2);
    for (var $l1 = 0, $end1 = j - 1; $l1 <= $end1; $l1++) {
      i = $l1;
      if (($mod.CardValues[i].cnt < 15) && ($mod.CardValues[i].cnt < $mod.CardValues[i + j].cnt)) {
        $mod.CardValues[i].coloravg = $mod.CardValues[i + j].coloravg;
        $mod.CardValues[i].restavg = $mod.CardValues[i + j].restavg;
      };
      if (($mod.CardValues[i + j].cnt < 15) && ($mod.CardValues[i + j].cnt < $mod.CardValues[i].cnt)) {
        $mod.CardValues[i + j].coloravg = $mod.CardValues[i].coloravg;
        $mod.CardValues[i + j].restavg = $mod.CardValues[i].restavg;
      };
      if (($mod.CardValues[i].coloravg > $mod.CardValues[i + j].coloravg) && ($mod.CardValues[i].cnt !== $mod.CardValues[i + j].cnt)) {
        realcol = $mod.CardValues[i].coloravg;
        if ($mod.CardValues[i].cnt < $mod.CardValues[i + j].cnt) {
          realcol = $mod.CardValues[i + j].coloravg;
        };
        $mod.CardValues[i].coloravg = realcol;
        $mod.CardValues[i + j].coloravg = realcol;
      };
      if (($mod.CardValues[i].restavg > $mod.CardValues[i + j].restavg) && ($mod.CardValues[i].cnt !== $mod.CardValues[i + j].cnt)) {
        realres = $mod.CardValues[i].restavg;
        if ($mod.CardValues[i].cnt < $mod.CardValues[i + j].cnt) {
          realres = $mod.CardValues[i + j].restavg;
        };
        $mod.CardValues[i].restavg = realres;
        $mod.CardValues[i + j].restavg = realres;
      };
    };
  };
  this.StoreLearnValues = function () {
    var data = 0;
    var datafinal = rtl.arraySetLength(null,0,366824);
    var outdata1 = 0;
    var outdata2 = 0;
    var outdata3 = 0;
    var outdata = 0;
    var i = 0;
    var j = 0;
    var k = 0;
    var cur = 0;
    var saveRes = 0;
    var f = 0;
    var ignore = false;
  };
  this.nrCards = function (color, bits, MayHave) {
    var Result = 0;
    var total = 0;
    var lo = 0;
    var current = 0;
    total = 0;
    lo = pas.DecOnMac.CardOf(color,0);
    for (var $l = lo, $end = lo + 8; $l <= $end; $l++) {
      current = $l;
      if ((MayHave.get()[current] & bits) > 0) total += 1;
    };
    Result = total;
    return Result;
  };
  this.ComputeColorAverages = function (bits, MayHave, sum, cnt) {
    var color = 0;
    var i = 0;
    for (color = 0; color <= 3; color++) {
      sum.get()[color] = 0;
      cnt.get()[color] = 0;
    };
    for (i = 9; i <= 35; i++) if ((MayHave.get()[i] & bits) > 0) {
      for (color = 0; color <= 3; color++) if (pas.DecOnMac.pColorOf[i] !== color) {
        sum.get()[color] = sum.get()[color] + pas.DecOnMac.pValueOfCard[i];
        cnt.get()[color] = cnt.get()[color] + 1;
      };
    };
  };
  this.ExpectTotal = function (fPlayer, MayHave, lo, hi) {
    var sum = rtl.arraySetLength(null,0,4);
    var cnt = rtl.arraySetLength(null,0,4);
    var color = 0;
    var index = 0;
    var stichindex = 0;
    var trumps = 0;
    var avg = 0.0;
    $mod.ComputeColorAverages(15 - pas.DecOnMac.pBit[fPlayer],MayHave,{get: function () {
        return sum;
      }, set: function (v) {
        sum = v;
      }},{get: function () {
        return cnt;
      }, set: function (v) {
        cnt = v;
      }});
    trumps = $mod.nrCards(0,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
    lo.set(0);
    hi.set(0);
    for (color = 0; color <= 3; color++) {
      index = $mod.LearnIndex(false,color,trumps,fPlayer,MayHave,{get: function () {
          return stichindex;
        }, set: function (v) {
          stichindex = v;
        }});
      if (index >= 0) {
        avg = 0;
        if (cnt[color] > 0) avg = sum[color] / cnt[color];
        if ((color === 0) || ($mod.LoNoneProb[stichindex] !== 1)) lo.set(lo.get() + $mod.CardValues[index].coloravg + ($mod.CardValues[index].restavg * avg));
        hi.set(hi.get() + $mod.CardValues[index + rtl.trunc(55350 / 2)].coloravg + ($mod.CardValues[index + rtl.trunc(55350 / 2)].restavg * avg));
      };
    };
  };
  this.Call = function (fnumPlayers, fPlayer, MayHave) {
    var Result = 0;
    var lo = 0.0;
    var hi = 0.0;
    var guess = 0;
    var tIndex = 0;
    var nIndex = 0;
    $mod.ExpectTotal(fPlayer,MayHave,{get: function () {
        return lo;
      }, set: function (v) {
        lo = v;
      }},{get: function () {
        return hi;
      }, set: function (v) {
        hi = v;
      }});
    if ($mod.BidValues[Math.round(lo)].loAvg <= $mod.BidValues[Math.round(hi)].hiAvg) {
      Result = 0}
     else if (fnumPlayers === 4) {
      Result = Math.round(hi + $mod.BidValues[Math.round(hi)].hiOff)}
     else Result = Math.round(0.8 * (hi + $mod.BidValues[Math.round(hi)].hiOff));
    return Result;
  };
  this.LearnIndex = function (wantmore, color, nrTrumps, fPlayer, MayHave, stichindex) {
    var Result = 0;
    var i = 0;
    var offset = 0;
    var count = 0;
    var index = 0;
    var totcards = 0;
    var hascard = false;
    var card = 0;
    var where = rtl.arraySetLength(null,0,9);
    hascard = false;
    stichindex.set(0);
    totcards = 0;
    card = pas.DecOnMac.CardOf(color,0);
    for (i = 0; i <= 8; i++) {
      where[i] = 0;
      if (MayHave.get()[card + i] > 0) {
        stichindex.set(2 * stichindex.get());
        totcards += 1;
        where[i] = 1;
        if (MayHave.get()[card + i] === pas.DecOnMac.pBit[fPlayer]) {
          where[i] = 2;
          hascard = true;
        } else stichindex.set(stichindex.get() + 1);
      };
    };
    var $tmp = totcards;
    if ($tmp === 0) {
      stichindex.set(stichindex.get() + 1022)}
     else if ($tmp === 1) {
      stichindex.set(stichindex.get() + 1020)}
     else if ($tmp === 2) {
      stichindex.set(stichindex.get() + 1016)}
     else if ($tmp === 3) {
      stichindex.set(stichindex.get() + 1008)}
     else if ($tmp === 4) {
      stichindex.set(stichindex.get() + 992)}
     else if ($tmp === 5) {
      stichindex.set(stichindex.get() + 960)}
     else if ($tmp === 6) {
      stichindex.set(stichindex.get() + 896)}
     else if ($tmp === 7) {
      stichindex.set(stichindex.get() + 768)}
     else if ($tmp === 8) {
      stichindex.set(stichindex.get() + 512)}
     else if ($tmp === 9) ;
    if (!hascard) {
      Result = -1;
      return Result;
    };
    index = 0;
    offset = 0;
    count = 0;
    if (color === 0) {
      for (i = 0; i <= 2; i++) {
        if (where[i] > 0) {
          count += 1;
          offset = 2 * offset;
          if (where[i] === 2) offset += 1;
        };
      };
      var $tmp1 = count;
      if ($tmp1 === 0) {
        offset = offset + 14}
       else if ($tmp1 === 1) {
        offset = offset + 12}
       else if ($tmp1 === 2) {
        offset = offset + 8}
       else if ($tmp1 === 3) ;
      for (i = 3; i <= 8; i++) index = (3 * index) + where[i];
      index = index + (offset * 729);
    } else {
      for (i = 0; i <= 3; i++) {
        if (where[i] > 0) {
          count += 1;
          index = 2 * index;
          if (where[i] === 2) index += 1;
        };
      };
      var $tmp2 = count;
      if ($tmp2 === 0) {
        index = index + 30}
       else if ($tmp2 === 1) {
        index = index + 28}
       else if ($tmp2 === 2) {
        index = index + 24}
       else if ($tmp2 === 3) {
        index = index + 16}
       else if ($tmp2 === 4) ;
      index = (3 * index) + where[4];
      count = 0;
      for (i = 5; i <= 7; i++) {
        if (where[i] > 0) {
          count += 1;
          offset = 2 * offset;
          if (where[i] === 2) offset += 1;
        };
      };
      var $tmp3 = count;
      if ($tmp3 === 0) {
        offset = offset + 14}
       else if ($tmp3 === 1) {
        offset = offset + 12}
       else if ($tmp3 === 2) {
        offset = offset + 8}
       else if ($tmp3 === 3) ;
      index = (3 * ((15 * index) + offset)) + where[8] + (15 * 729);
      var $tmp4 = nrTrumps;
      if ($tmp4 === 0) {}
      else if ($tmp4 === 1) {
        index = index + 4185}
       else if (($tmp4 === 2) || ($tmp4 === 3)) {
        index = index + (2 * 4185)}
       else {
        index = index + (3 * 4185);
      };
    };
    if (wantmore) index = index + rtl.trunc(55350 / 2);
    Result = index;
    return Result;
  };
  this.ProbIndex = function (played) {
    var Result = 0;
    var count = 0;
    var i = 0;
    var start = 0;
    count = 0;
    for (i = 0; i <= 8; i++) if (i in played.get()) count += 1;
    var $tmp = count;
    if ($tmp === 0) {
      start = 0}
     else if ($tmp === 1) {
      start = 1}
     else if ($tmp === 2) {
      start = 10}
     else if ($tmp === 3) start = 46;
    i = 0;
    while (count > 0) {
      if (i in played.get()) {
        start = start + $mod.binom[8 - i][count];
        count -= 1;
      };
      i += 1;
    };
    Result = start;
    return Result;
  };
  $mod.$implcode = function () {
    $mod.$rtti.$StaticArray("TSimpCards",{dims: [9], eltype: rtl.longint});
    $mod.$rtti.$StaticArray("MyHand",{dims: [9], eltype: rtl.longint});
    $mod.$rtti.$StaticArray("Probability$a",{dims: [130], eltype: pas.System.$rtti["Real"]});
    $impl.Probability = rtl.arraySetLength(null,0.0,130);
  };
},["Dialogs","PcFiles"]);
rtl.module("RGTrick",["System","DecOnMac","RGLearn"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.BestLeadPlay = function (level, numPlayed, totPlayers, fPlayer, MayHave, selHand, pointsNeeded) {
    var Result = 0;
    var i = 0;
    var card = 0;
    var bestplay = 0;
    var sum = rtl.arraySetLength(null,0,4);
    var cnt = rtl.arraySetLength(null,0,4);
    var color = 0;
    var dummy = 0;
    var nrTrumps = 0;
    if ((pointsNeeded > 10) && (numPlayed < 6)) {
      pas.RGLearn.ComputeColorAverages(15 - pas.DecOnMac.pBit[fPlayer],MayHave,{get: function () {
          return sum;
        }, set: function (v) {
          sum = v;
        }},{get: function () {
          return cnt;
        }, set: function (v) {
          cnt = v;
        }});
      nrTrumps = pas.RGLearn.nrCards(0,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
      if (pointsNeeded > (10 + $impl.EstimateMinimum(fPlayer,MayHave,sum[0],cnt[0]))) {
        bestplay = selHand.fCard[0];
        for (var $l = 1, $end = selHand.fNum - 1; $l <= $end; $l++) {
          i = $l;
          card = selHand.fCard[i];
          if (pas.DecOnMac.pRankOf[card] > pas.DecOnMac.pRankOf[bestplay]) bestplay = card;
        };
        Result = bestplay;
        return Result;
      };
    };
    Result = $impl.BestDiff(level,0,0,-1,pointsNeeded,numPlayed,totPlayers,fPlayer,MayHave,selHand);
    return Result;
  };
  this.BestNonLeadCard = function (level, trickCard, trickColor, trickValue, pointsNeeded, numPlayed, totPlayers, fPlayer, MayHave, selHand) {
    var Result = 0;
    var i = 0;
    var bestplay = 0;
    var card = 0;
    bestplay = $impl.BestDiff(level,trickCard,trickColor,trickValue,pointsNeeded,numPlayed,totPlayers,fPlayer,MayHave,selHand);
    Result = bestplay;
    return Result;
  };
  this.ProvableReduction = function (trickCard, trickValue, playedCards, totPlayers, fPlayer, MayHave, selHand, pointsNeeded) {
    var i = 0;
    var j = 0;
    var k = 0;
    var l = 0;
    var max = 0;
    var which = 0;
    var nrtrumps = 0;
    var bits = 0;
    var c1 = 0;
    var c2 = 0;
    var temp = 0;
    var ok = false;
    var color = 0;
    var dummy = 0;
    var StoreIndex = 0;
    for (var $l = 0, $end = selHand.fNum - 1; $l <= $end; $l++) {
      i = $l;
      for (var $l1 = i + 1, $end1 = selHand.fNum - 1; $l1 <= $end1; $l1++) {
        j = $l1;
        if (selHand.fCard[i] > selHand.fCard[j]) {
          temp = selHand.fCard[i];
          selHand.fCard[i] = selHand.fCard[j];
          selHand.fCard[j] = temp;
        };
      };
    };
    if ((playedCards % totPlayers) !== 0) MayHave.get()[trickCard] = 15 - pas.DecOnMac.pBit[fPlayer];
    if (MayHave.get()[8] === pas.DecOnMac.pBit[fPlayer]) {
      j = 7;
      while ((j >= 0) && (MayHave.get()[j] === 0)) j -= 1;
      if ((j >= 0) && (MayHave.get()[j] === pas.DecOnMac.pBit[fPlayer])) {
        for (var $l2 = 0, $end2 = selHand.fNum - 1; $l2 <= $end2; $l2++) {
          i = $l2;
          if (selHand.fCard[i] === 8) {
            selHand.fNum -= 1;
            selHand.fCard[i] = selHand.fCard[selHand.fNum];
          };
        };
      };
    };
    if ((MayHave.get()[8] === 0) || (MayHave.get()[8] === pas.DecOnMac.pBit[fPlayer])) {
      i = 7;
      while ((i >= 0) && (MayHave.get()[i] === 0)) i -= 1;
      while ((i >= 0) && (MayHave.get()[i] === pas.DecOnMac.pBit[fPlayer])) {
        j = i - 1;
        while ((j >= 0) && (MayHave.get()[j] === 0)) j -= 1;
        k = j;
        if ((j >= 0) && (MayHave.get()[j] === pas.DecOnMac.pBit[fPlayer])) {
          if (pas.DecOnMac.pValueOfCard[i] < pas.DecOnMac.pValueOfCard[j]) {
            j = i;
            i = k;
          };
          for (var $l3 = 0, $end3 = selHand.fNum - 1; $l3 <= $end3; $l3++) {
            i = $l3;
            if (selHand.fCard[i] === j) {
              selHand.fNum -= 1;
              selHand.fCard[i] = selHand.fCard[selHand.fNum];
            };
          };
        };
        i = k;
      };
    };
    i = 0;
    while (i < (selHand.fNum - 1)) {
      c1 = selHand.fCard[i];
      if (pas.DecOnMac.pValueOfCard[c1] === 0) {
        j = i + 1;
        while (j < selHand.fNum) {
          c2 = selHand.fCard[j];
          if ((pas.DecOnMac.pValueOfCard[c2] === 0) && $impl.Adjacent(c1,c2,15 - pas.DecOnMac.pBit[fPlayer],MayHave)) {
            selHand.fNum -= 1;
            selHand.fCard[j] = selHand.fCard[selHand.fNum];
          } else j += 1;
        };
      };
      i += 1;
    };
    max = -1;
    nrtrumps = pas.RGLearn.nrCards(0,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
    if (nrtrumps === 0) {
      for (var $l4 = 0, $end4 = selHand.fNum - 1; $l4 <= $end4; $l4++) {
        i = $l4;
        j = selHand.fCard[i];
        if ((j < 9) && (pas.DecOnMac.pValueOfCard[j] > max)) {
          which = i;
          max = pas.DecOnMac.pValueOfCard[j];
        };
      };
      for (var $l5 = selHand.fNum - 1; $l5 >= 0; $l5--) {
        i = $l5;
        if ((i !== which) && (selHand.fCard[i] < 9)) {
          selHand.fNum -= 1;
          selHand.fCard[i] = selHand.fCard[selHand.fNum];
        };
      };
    };
    if ((selHand.fNum > 1) && (pas.RGLearn.nrCards(0,pas.DecOnMac.pBit[fPlayer],MayHave) === 0)) {
      ok = true;
      for (color = 0; color <= 3; color++) {
        dummy = pas.RGLearn.LearnIndex(false,color,nrtrumps,fPlayer,MayHave,{get: function () {
            return StoreIndex;
          }, set: function (v) {
            StoreIndex = v;
          }});
        if ((dummy >= 0) && ((pas.RGLearn.HiNoneProb[StoreIndex] < 1) || (pas.RGLearn.HiAllProb[StoreIndex] > 0))) ok = false;
      };
      if (ok) {
        i = 0;
        while (i < (selHand.fNum - 1)) {
          c1 = selHand.fCard[i];
          j = i + 1;
          while (j < selHand.fNum) {
            c2 = selHand.fCard[j];
            if (pas.DecOnMac.pValueOfCard[c1] === pas.DecOnMac.pValueOfCard[c2]) {
              selHand.fNum -= 1;
              selHand.fCard[j] = selHand.fCard[selHand.fNum];
            };
            j += 1;
          };
          i += 1;
        };
      };
    };
    if (((playedCards % totPlayers) === 0) && (selHand.fNum > 1)) {
      ok = true;
      i = 0;
      while ((i < selHand.fNum) && ok) {
        j = selHand.fCard[i];
        if (!$impl.IsBock(j,15 - pas.DecOnMac.pBit[fPlayer],MayHave) || ((pas.DecOnMac.pColorOf[j] !== 0) && (nrtrumps > 0))) ok = false;
        i += 1;
      };
      if (ok) selHand.fNum = 1;
    };
    if ((playedCards % totPlayers) !== 0) MayHave.get()[trickCard] = 0;
  };
  this.HeuristicReduction = function (trickCard, trickValue, playedCards, totPlayers, fPlayer, MayHave, selHand, pointsNeeded) {
    var i = 0;
    var j = 0;
    var bestcolor = 0;
    var nrTrumps = 0;
    var totalpoints = 0;
    var best = 0.0;
    var dummy = 0;
    var probIndex = rtl.arraySetLength(null,0,4);
    var CountColor = rtl.arraySetLength(null,0,4);
    var k = 0;
    var current = 0;
    var card = 0;
    var card2 = 0;
    var adj = false;
    if ((playedCards % totPlayers) === 0) {
      nrTrumps = pas.RGLearn.nrCards(0,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
      if (nrTrumps > 0) {
        totalpoints = 5;
        i = 0;
        while ((pointsNeeded >= totalpoints) && (i < 36)) {
          if (MayHave.get()[i] > 0) totalpoints = totalpoints + pas.DecOnMac.pValueOfCard[i];
          i += 1;
        };
        if (pointsNeeded >= totalpoints) {
          j = 8;
          while ((j > 0) && (MayHave.get()[j] === 0)) j -= 1;
          if (MayHave.get()[j] === pas.DecOnMac.pBit[fPlayer]) {
            selHand.fNum = 1;
            selHand.fCard[0] = j;
          };
        };
      };
      if (nrTrumps === 0) {
        i = selHand.fNum;
        while ((selHand.fNum > 1) && (i > 0)) {
          i -= 1;
          if (selHand.fCard[i] < 9) {
            selHand.fNum -= 1;
            selHand.fCard[i] = selHand.fCard[selHand.fNum];
          };
        };
      };
      if (pointsNeeded <= 0) {
        for (i = 1; i <= 3; i++) {
          CountColor[i] = pas.RGLearn.nrCards(i,pas.DecOnMac.pBit[fPlayer],MayHave);
          if (CountColor[i] > 0) {
            CountColor[i] = -CountColor[i];
            for (j = 0; j <= 8; j++) if ((MayHave.get()[pas.DecOnMac.CardOf(i,j)] & (15 - pas.DecOnMac.pBit[fPlayer])) > 0) CountColor[i] = Math.abs(CountColor[i]);
          };
        };
        best = -1;
        bestcolor = 0;
        for (i = 1; i <= 3; i++) {
          dummy = pas.RGLearn.LearnIndex(false,i,0,fPlayer,MayHave,{a: i, p: probIndex, get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }});
          if ((CountColor[i] === 1) && (pas.RGLearn.LoNoneProb[probIndex[i]] > best)) {
            best = pas.RGLearn.LoNoneProb[probIndex[i]];
            bestcolor = i;
          };
        };
        if (best > 0) for (var $l = selHand.fNum - 1; $l >= 0; $l--) {
          i = $l;
          j = selHand.fCard[i];
          if ((pas.DecOnMac.pColorOf[j] !== bestcolor) && (pas.DecOnMac.pColorOf[j] !== 0) && (best > pas.RGLearn.LoNoneProb[probIndex[pas.DecOnMac.pColorOf[j]]])) {
            selHand.fNum -= 1;
            selHand.fCard[i] = selHand.fCard[selHand.fNum];
          };
        };
        bestcolor = 0;
        for (i = 1; i <= 3; i++) {
          if ((pas.RGLearn.LoNoneProb[probIndex[i]] === 1) && (CountColor[i] > 0)) {
            bestcolor = i;
          };
        };
        if (bestcolor > 0) {
          dummy = pas.RGLearn.LearnIndex(false,0,0,fPlayer,MayHave,{a: 0, p: probIndex, get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }});
          for (var $l1 = selHand.fNum - 1; $l1 >= 0; $l1--) {
            i = $l1;
            j = selHand.fCard[i];
            if ((pas.DecOnMac.pColorOf[j] !== bestcolor) && (pas.RGLearn.LoNoneProb[probIndex[pas.DecOnMac.pColorOf[j]]] < 1)) {
              selHand.fNum -= 1;
              selHand.fCard[i] = selHand.fCard[selHand.fNum];
            };
          };
        };
      };
      if ((playedCards === 0) && (selHand.fNum > 1) && (MayHave.get()[8] === pas.DecOnMac.pBit[fPlayer])) for (var $l2 = 0, $end = selHand.fNum - 1; $l2 <= $end; $l2++) {
        i = $l2;
        if (selHand.fCard[i] === 8) {
          selHand.fNum -= 1;
          selHand.fCard[i] = selHand.fCard[selHand.fNum];
        };
      };
    } else {
      if (pointsNeeded <= 0) {
        i = 0;
        while (i < selHand.fNum) {
          card = selHand.fCard[i];
          if (!pas.DecOnMac.PBetterCard(card,trickCard)) {
            j = i + 1;
            while (j < selHand.fNum) {
              card2 = selHand.fCard[j];
              if ((pas.DecOnMac.pColorOf[card] === pas.DecOnMac.pColorOf[card2]) && !pas.DecOnMac.PBetterCard(card2,trickCard)) {
                adj = $impl.Adjacent(card,card2,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
                if ((adj || pas.DecOnMac.PBetterCard(card,card2)) && (pas.DecOnMac.pValueOfCard[card] >= pas.DecOnMac.pValueOfCard[card2])) {
                  selHand.fNum -= 1;
                  selHand.fCard[j] = selHand.fCard[selHand.fNum];
                  j -= 1;
                } else if ((adj || pas.DecOnMac.PBetterCard(card2,card)) && (pas.DecOnMac.pValueOfCard[card2] >= pas.DecOnMac.pValueOfCard[card])) {
                  selHand.fNum -= 1;
                  selHand.fCard[i] = selHand.fCard[selHand.fNum];
                  i -= 1;
                  j = selHand.fNum;
                };
              };
              j += 1;
            };
          };
          i += 1;
        };
      };
    };
  };
  this.UpdateMayHave = function (numPlayed, totPlayers, card, trickCard, trickColor, currPlayer, MayHave) {
    var max = 0;
    var i = 0;
    MayHave.get()[card] = 0;
    if ((numPlayed % totPlayers) !== 1) {
      if ((pas.DecOnMac.pColorOf[card] !== trickColor) && ((pas.DecOnMac.pColorOf[card] !== 0) || (card < trickCard))) {
        if (trickColor === 0) {
          max = 9 - 1}
         else max = 9;
        for (var $l = max - 1; $l >= 0; $l--) {
          i = $l;
          MayHave.get()[pas.DecOnMac.CardOf(trickColor,i)] = MayHave.get()[pas.DecOnMac.CardOf(trickColor,i)] & (15 - pas.DecOnMac.pBit[currPlayer]);
        };
      };
    };
  };
  this.StartWorstDiff = function (level, MayHave, fPlayer, trickcolor, playercard, bestcard, needed, stichvalue, totalpoints, numPlayed, totPlayers) {
    var Result = 0.0;
    var i = 0;
    var j = 0;
    var k = 0;
    var nrTrumps = 0;
    var playerTrumps = 0;
    var max = 0;
    var bits = 0;
    var expect = 0;
    var card = 0;
    var haschoice = false;
    var oksofar = false;
    var played = {};
    var cards = rtl.arraySetLength(null,0,9);
    var numCards = 0;
    var numPlayers = 0;
    var numToPlay = 0;
    var numYetToPlay = 0;
    var playerconfig = 0;
    var nrplayedtrumps = 0;
    var sum = rtl.arraySetLength(null,0,4);
    var cnt = rtl.arraySetLength(null,0,4);
    var LastIndex = rtl.arraySetLength(null,0,4);
    var StoreIndex = rtl.arraySetLength(null,0,4);
    var LastNrTrumps = 0;
    var OrigMayHave = rtl.arraySetLength(null,0,36);
    var avg = 0.0;
    var prob = 0.0;
    var probtot = 0.0;
    var total = 0.0;
    var tottotal = 0.0;
    var nrT = 0;
    var nrP = 0;
    var notplayer = 0;
    function Update(add, card) {
      var color = 0;
      var val = 0;
      var off = 0;
      LastIndex[pas.DecOnMac.pColorOf[card]] = -99;
      val = pas.DecOnMac.pValueOfCard[card];
      if (add) {
        off = 1;
        MayHave.get()[card] = OrigMayHave[card];
      } else {
        val = -val;
        off = -1;
        MayHave.get()[card] = 0;
      };
      totalpoints = totalpoints + val;
      if (card >= 9) {
        for (color = 0; color <= 3; color++) if (pas.DecOnMac.pColorOf[card] !== color) {
          sum[color] = sum[color] + val;
          cnt[color] = cnt[color] + off;
        };
      } else nrTrumps = nrTrumps + off;
    };
    function RealWorstDiff(gotstich, stichvalue) {
      var Result = 0.0;
      var thisval = 0.0;
      var avg = 0.0;
      var i = 0;
      var count = 0;
      var nohave = 0;
      var index = 0;
      var temp = 0;
      var ok = false;
      var lonone = 0.0;
      var loall = 0.0;
      var hinone = 0.0;
      var hiall = 0.0;
      var color = 0;
      var allplayers = 0;
      var lo = 0.0;
      var hi = 0.0;
      var diff = 0.0;
      var lowdiff = 0.0;
      thisval = 0;
      if (gotstich) {
        thisval = stichvalue;
      };
      lo = 0;
      hi = 0;
      lonone = 1;
      loall = 1;
      hinone = 1;
      hiall = 1;
      for (color = 0; color <= 3; color++) {
        if ((LastIndex[color] === -99) || (nrTrumps !== LastNrTrumps)) LastIndex[color] = pas.RGLearn.LearnIndex(false,color,nrTrumps,fPlayer,MayHave,{a: color, p: StoreIndex, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
        index = LastIndex[color];
        if (index >= 0) {
          avg = 0;
          if (cnt[color] > 0) avg = sum[color] / cnt[color];
          if ((color === 0) || ((needed - thisval) > 0) || !$impl.LoNoneProbEqualOne(gotstich,color,MayHave,fPlayer)) lo = lo + pas.RGLearn.CardValues[index].coloravg + (pas.RGLearn.CardValues[index].restavg * avg);
          hi = hi + pas.RGLearn.CardValues[index + rtl.trunc(55350 / 2)].coloravg + (pas.RGLearn.CardValues[index + rtl.trunc(55350 / 2)].restavg * avg);
          temp = StoreIndex[color];
          lonone = lonone * pas.RGLearn.LoNoneProb[temp];
          loall = loall * pas.RGLearn.LoAllProb[temp];
          hinone = hinone * pas.RGLearn.HiNoneProb[temp];
          hiall = hiall * pas.RGLearn.HiAllProb[temp];
        };
      };
      LastNrTrumps = nrTrumps;
      if (lo > totalpoints) lo = totalpoints;
      if (hi > totalpoints) hi = totalpoints;
      if ((nrTrumps === 0) && ((loall === 1) || ((hiall === 1) && (needed >= (totalpoints + thisval))))) {
        if (gotstich) {
          Result = Math.abs(needed - (thisval + totalpoints));
          return Result;
        } else {
          ok = true;
          nohave = 0;
          for (color = 0; color <= 3; color++) if (LastIndex[color] < 0) {
            ok = ok && (pas.RGLearn.nrCards(color,15,MayHave) === 0);
            if (color > 0) nohave += 1;
          };
          if (ok || (nohave === 3) || ((hiall === 1) && (nrTrumps === 0) && (playerTrumps > 0) && (needed >= totalpoints))) {
            Result = Math.abs(needed - (thisval + totalpoints));
            return Result;
          };
        };
      };
      avg = 0;
      if (cnt[0] > 0) avg = sum[0] / cnt[0];
      if ((playerTrumps === 0) && ((hinone === 1) || ((lonone === 1) && ((needed - thisval) <= (2 * avg))))) {
        if (!gotstich) {
          Result = Math.abs(needed - thisval);
          return Result;
        } else {
          ok = true;
          for (color = 0; color <= 3; color++) if (LastIndex[color] > 0) {
            ok = ok && (pas.RGLearn.nrCards(color,15 - pas.DecOnMac.pBit[fPlayer],MayHave) > 0);
          };
          if (ok) {
            Result = Math.abs(needed - thisval);
            return Result;
          };
        };
      };
      temp = $impl.EstimateMinimum(fPlayer,MayHave,sum[0],cnt[0]);
      if (((needed - thisval) > lo) && (playerTrumps > 0) && (playerTrumps > nrTrumps) && (pas.RGLearn.HiAllProb[StoreIndex[0]] === 1)) {
        if (temp > hi) hi = temp;
        if ((temp + 5) > (needed - thisval)) {
          i = needed;
          needed = 0;
          lo = (i - thisval) + (Math.round(RealWorstDiff(gotstich,stichvalue)) / 100);
          hi = lo;
          needed = i;
        };
      };
      if ((playerTrumps > nrTrumps) && ((needed - thisval) > lo)) {
        diff = needed - thisval;
        if (diff > totalpoints) diff = totalpoints;
        lo = lo + ((diff - lo) / 2);
        hi = hi + ((diff - hi) / 2);
      };
      if (lo > totalpoints) lo = totalpoints;
      if (hi > totalpoints) hi = totalpoints;
      lo = lo * (4 - ((3 * level) / 99));
      hi = hi * (4 - ((3 * level) / 99));
      lo = Math.abs(needed - (thisval + lo));
      hi = Math.abs(needed - (thisval + hi));
      if (hi < lo) lo = hi;
      if ((needed - thisval) < temp) temp = Math.round(needed - thisval - 1);
      hi = needed - thisval - temp;
      if (hi > 0) {
        lo = lo + (hi / 3)}
       else if ((needed - thisval) < 0) lo = lo - ((needed - thisval) / 3);
      if (playercard < 9) {
        if ((needed - thisval) > 0) lo = lo + 3;
      };
      if (MayHave.get()[8] !== pas.DecOnMac.pBit[fPlayer]) lo = lo + 3;
      Result = lo;
      return Result;
    };
    OrigMayHave = MayHave.get().slice(0);
    MayHave.get()[playercard] = 0;
    totalpoints = totalpoints - pas.DecOnMac.pValueOfCard[playercard];
    numToPlay = (35 - numPlayed) % totPlayers;
    bits = 0;
    for (var $l = 1, $end = numToPlay; $l <= $end; $l++) {
      i = $l;
      bits = bits + pas.DecOnMac.pBit[(fPlayer + i) % totPlayers];
    };
    numCards = 0;
    numPlayers = 0;
    numYetToPlay = 0;
    for (i = 0; i <= 8; i++) {
      card = pas.DecOnMac.CardOf(trickcolor,i);
      if ((MayHave.get()[card] & bits) > 0) {
        cards[numCards] = card;
        numCards += 1;
        k = 0;
        for (j = 0; j <= 3; j++) if ((MayHave.get()[card] & pas.DecOnMac.pBit[j]) > 0) k += 1;
        if (k > numPlayers) numPlayers = k;
        k = 0;
        for (j = 0; j <= 3; j++) if ((MayHave.get()[card] & bits & pas.DecOnMac.pBit[j]) > 0) k += 1;
        if (k > numYetToPlay) numYetToPlay = k;
      };
    };
    pas.RGLearn.ComputeColorAverages(15 - pas.DecOnMac.pBit[fPlayer],MayHave,{get: function () {
        return sum;
      }, set: function (v) {
        sum = v;
      }},{get: function () {
        return cnt;
      }, set: function (v) {
        cnt = v;
      }});
    nrTrumps = pas.RGLearn.nrCards(0,15 - pas.DecOnMac.pBit[fPlayer],MayHave);
    playerTrumps = pas.RGLearn.nrCards(0,pas.DecOnMac.pBit[fPlayer],MayHave);
    LastNrTrumps = -1;
    avg = 0;
    if (cnt[trickcolor] > 0) avg = sum[trickcolor] / cnt[trickcolor];
    haschoice = (trickcolor === 0) && ((MayHave.get()[8] & bits) > 0);
    max = 0;
    if ((trickcolor > 0) && (needed > 5)) {
      for (card = 0; card <= 8; card++) {
        if (pas.DecOnMac.PBetterCard(card,bestcard) && ((MayHave.get()[card] & bits) > 0)) {
          k = 0;
          for (j = 0; j <= 3; j++) if (((pas.DecOnMac.pBit[j] & bits) > 0) && ((MayHave.get()[card] & pas.DecOnMac.pBit[j]) > 0)) k += 1;
          if (k > max) max = k;
        };
      };
      if (max > numPlayers) max = numPlayers;
      if (max > nrTrumps) max = nrTrumps;
    };
    tottotal = 0;
    probtot = 0;
    for (var $l1 = 0, $end1 = max; $l1 <= $end1; $l1++) {
      nrplayedtrumps = $l1;
      i = nrplayedtrumps;
      card = 9;
      while ((i > 0) && (card > 0)) {
        card -= 1;
        if ((MayHave.get()[card] & bits) > 0) {
          Update(false,card);
          i -= 1;
        };
      };
      oksofar = (playercard === bestcard) && (nrplayedtrumps === 0);
      numToPlay = numToPlay - nrplayedtrumps;
      total = 0;
      if ((numCards === 0) || (numToPlay === 0) || (numYetToPlay === 0)) {
        prob = 1;
      } else {
        playerconfig = 0;
        if (numPlayers === 2) {
          playerconfig = 1}
         else if (numPlayers === 3) playerconfig = 3;
        if (numYetToPlay < numToPlay) {
          playerconfig = (playerconfig + numYetToPlay) - 1}
         else playerconfig = (playerconfig + numToPlay) - 1;
        played = {};
        prob = pas.RGLearn.PlayProb[numCards - 1][playerconfig][+haschoice][pas.RGLearn.ProbIndex({get: function () {
            return played;
          }, set: function (v) {
            played = v;
          }})];
      };
      expect = Math.round(numToPlay * avg);
      if (prob > 0) {
        totalpoints = totalpoints - expect;
        total = prob * RealWorstDiff(oksofar,stichvalue + expect);
        totalpoints = totalpoints + expect;
      };
      if ((numToPlay >= 1) && (numYetToPlay >= 1)) {
        expect = Math.round((numToPlay - 1) * avg);
        totalpoints = totalpoints - expect;
        for (var $l2 = 0, $end2 = numCards - 1; $l2 <= $end2; $l2++) {
          i = $l2;
          played = rtl.createSet(i);
          prob = pas.RGLearn.PlayProb[numCards - 1][playerconfig][+haschoice][pas.RGLearn.ProbIndex({get: function () {
              return played;
            }, set: function (v) {
              played = v;
            }})];
          if (prob > 0) {
            Update(false,cards[i]);
            stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[i]];
            total = total + (prob * RealWorstDiff(oksofar && pas.DecOnMac.PBetterCard(playercard,cards[i]),stichvalue + expect));
            stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[i]];
            Update(true,cards[i]);
          };
        };
        totalpoints = totalpoints + expect;
      };
      if ((numToPlay >= 2) && (numYetToPlay >= 2)) {
        expect = Math.round((numToPlay - 2) * avg);
        totalpoints = totalpoints - expect;
        for (var $l3 = 0, $end3 = numCards - 1; $l3 <= $end3; $l3++) {
          i = $l3;
          played = rtl.createSet(i);
          Update(false,cards[i]);
          stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[i]];
          for (var $l4 = i + 1, $end4 = numCards - 1; $l4 <= $end4; $l4++) {
            j = $l4;
            played = rtl.unionSet(played,rtl.createSet(j));
            prob = pas.RGLearn.PlayProb[numCards - 1][playerconfig][+haschoice][pas.RGLearn.ProbIndex({get: function () {
                return played;
              }, set: function (v) {
                played = v;
              }})];
            if (prob > 0) {
              Update(false,cards[j]);
              stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[j]];
              total = total + (prob * RealWorstDiff(oksofar && pas.DecOnMac.PBetterCard(playercard,cards[j]),stichvalue + expect));
              stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[j]];
              Update(true,cards[j]);
            };
            played = rtl.diffSet(played,rtl.createSet(j));
          };
          stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[i]];
          Update(true,cards[i]);
        };
        totalpoints = totalpoints + expect;
      };
      if ((numToPlay >= 3) && (numYetToPlay >= 3)) {
        for (var $l5 = 0, $end5 = numCards - 1; $l5 <= $end5; $l5++) {
          i = $l5;
          played = rtl.createSet(i);
          Update(false,cards[i]);
          stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[i]];
          for (var $l6 = i + 1, $end6 = numCards - 1; $l6 <= $end6; $l6++) {
            j = $l6;
            played = rtl.unionSet(played,rtl.createSet(j));
            Update(false,cards[j]);
            stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[j]];
            for (var $l7 = j + 1, $end7 = numCards - 1; $l7 <= $end7; $l7++) {
              k = $l7;
              played = rtl.unionSet(played,rtl.createSet(k));
              prob = pas.RGLearn.PlayProb[numCards - 1][playerconfig][+haschoice][pas.RGLearn.ProbIndex({get: function () {
                  return played;
                }, set: function (v) {
                  played = v;
                }})];
              if (prob > 0) {
                Update(false,cards[k]);
                stichvalue = stichvalue + pas.DecOnMac.pValueOfCard[cards[k]];
                total = total + (prob * RealWorstDiff(oksofar && pas.DecOnMac.PBetterCard(playercard,cards[k]),stichvalue));
                stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[k]];
                Update(true,cards[k]);
              };
              played = rtl.diffSet(played,rtl.createSet(k));
            };
            stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[j]];
            Update(true,cards[j]);
            played = rtl.diffSet(played,rtl.createSet(j));
          };
          stichvalue = stichvalue - pas.DecOnMac.pValueOfCard[cards[i]];
          Update(true,cards[i]);
        };
      };
      i = nrplayedtrumps;
      card = 9;
      while ((i > 0) && (card > 0)) {
        card -= 1;
        if ((playercard !== card) && (OrigMayHave[card] !== MayHave.get()[card])) {
          Update(true,card);
          i -= 1;
        };
      };
      numToPlay = numToPlay + nrplayedtrumps;
      if (trickcolor > 0) {
        prob = $impl.ComputeProb(bestcard,nrplayedtrumps,(fPlayer + 1) % totPlayers,max,MayHave,totPlayers)}
       else prob = 1;
      probtot = probtot + prob;
      tottotal = tottotal + (prob * total);
    };
    Result = tottotal / probtot;
    MayHave.get()[playercard] = OrigMayHave[playercard];
    return Result;
  };
  $mod.$implcode = function () {
    $impl.IsBock = function (card, bits, MayHave) {
      var Result = false;
      var better = 0;
      var high = 0;
      if (card < (36 - 1)) {
        high = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[card],8);
        for (var $l = card + 1, $end = high; $l <= $end; $l++) {
          better = $l;
          if ((MayHave.get()[better] & bits) > 0) {
            Result = false;
            return Result;
          };
        };
      };
      Result = true;
      return Result;
    };
    $mod.$rtti.$StaticArray("TColorIndex",{dims: [4], eltype: rtl.longint});
    $impl.EstimateMinimum = function (fPlayer, MayHave, total, reserve) {
      var Result = 0;
      var i = 0;
      var certain = 0;
      var count = 0;
      var bal = 0;
      var lo = rtl.arraySetLength(null,0.0,4);
      certain = 0;
      count = 0;
      bal = 0;
      for (var $l = 8; $l >= 0; $l--) {
        i = $l;
        if (MayHave.get()[i] > 0) {
          if (MayHave.get()[i] !== pas.DecOnMac.pBit[fPlayer]) {
            bal -= 1;
          } else {
            bal += 1;
            if (bal > 0) {
              certain = certain + pas.DecOnMac.pValueOfCard[i];
              count = count + 3;
            };
          };
        };
      };
      lo[1] = 0;
      lo[2] = 0;
      lo[3] = 0;
      if ((bal > 0) || (MayHave.get()[8] === pas.DecOnMac.pBit[fPlayer])) {
        for (i = 9; i <= 35; i++) {
          if (MayHave.get()[i] === pas.DecOnMac.pBit[fPlayer]) {
            if ($impl.IsBock(i,15 - pas.DecOnMac.pBit[fPlayer],MayHave)) {
              certain = certain + pas.DecOnMac.pValueOfCard[i];
              count = count + 3;
              lo[pas.DecOnMac.pColorOf[i]] = lo[pas.DecOnMac.pColorOf[i]] + pas.DecOnMac.pValueOfCard[i];
              if (reserve > 0) lo[pas.DecOnMac.pColorOf[i]] = lo[pas.DecOnMac.pColorOf[i]] + ((3 * total) / reserve);
            };
          };
        };
      };
      if (reserve > 0) {
        certain = certain + rtl.trunc((count * total) / reserve);
        if ((1.3 * rtl.trunc((count * total) / reserve)) < (total + 5)) certain = certain + rtl.trunc(rtl.trunc((3 * (count * total)) / reserve) / 10);
      };
      Result = certain;
      return Result;
    };
    $impl.ComputeProb = function (bestcard, nrtrumpstoplay, thisplayer, nrplayerleft, MayHave, totPlayers) {
      var Result = 0.0;
      var res = 0.0;
      var notrumpprob = 0.0;
      var card = 0;
      var j = 0;
      var k = 0;
      var highest = 0;
      var temp = 0;
      if (nrplayerleft === 0) {
        if (nrtrumpstoplay === 0) {
          Result = 1}
         else Result = 0;
      } else if (nrtrumpstoplay > nrplayerleft) {
        Result = 0}
       else {
        notrumpprob = 1;
        for (card = 0; card <= 8; card++) {
          if (pas.DecOnMac.PBetterCard(card,bestcard) && ((MayHave.get()[card] & pas.DecOnMac.pBit[thisplayer]) > 0)) {
            highest = card;
            k = 0;
            for (j = 0; j <= 3; j++) if ((MayHave.get()[card] & pas.DecOnMac.pBit[j]) > 0) k += 1;
            notrumpprob = notrumpprob * (1 - (1 / k));
          };
        };
        if (notrumpprob < 1) {
          notrumpprob = (1 + notrumpprob) / 2;
          card = 9;
          while ((card < 36) && ((MayHave.get()[card] & pas.DecOnMac.pBit[thisplayer]) === 0)) card += 1;
          if (card === 36) notrumpprob = 0;
        };
        res = notrumpprob * $impl.ComputeProb(bestcard,nrtrumpstoplay,(thisplayer + 1) % totPlayers,nrplayerleft - 1,MayHave,totPlayers);
        if (notrumpprob < 1) {
          temp = MayHave.get()[highest];
          MayHave.get()[highest] = 0;
          res = res + ((1 - notrumpprob) * $impl.ComputeProb(bestcard,nrtrumpstoplay - 1,(thisplayer + 1) % totPlayers,nrplayerleft - 1,MayHave,totPlayers));
          MayHave.get()[highest] = temp;
        };
        Result = res;
      };
      return Result;
    };
    $impl.LoNoneProbEqualOne = function (lead, color, MayHave, fPlayer) {
      var Result = false;
      var lo = 0;
      var hi = 0;
      var i = 0;
      var bal = 0;
      var omit = 0;
      var card = 0;
      lo = 0;
      omit = -1;
      if (lead) {
        while ((lo < 8) && (MayHave.get()[pas.DecOnMac.CardOf(color,lo)] !== pas.DecOnMac.pBit[fPlayer])) {
          if (MayHave.get()[pas.DecOnMac.CardOf(color,lo)] > 0) {
            Result = false;
            return Result;
          };
          lo += 1;
        };
        lo += 1;
        i = 8;
        while ((i >= 0) && ((MayHave.get()[pas.DecOnMac.CardOf(color,i)] & (15 - pas.DecOnMac.pBit[fPlayer])) === 0)) {
          i -= 1;
        };
        omit = i;
      };
      bal = 0;
      for (var $l = lo; $l <= 8; $l++) {
        i = $l;
        card = pas.DecOnMac.CardOf(color,i);
        if (MayHave.get()[card] > 0) {
          if (MayHave.get()[card] === pas.DecOnMac.pBit[fPlayer]) {
            bal += 1;
            if (bal <= 0) {
              Result = false;
              return Result;
            };
          } else if (i !== omit) bal -= 1;
        };
      };
      Result = true;
      return Result;
    };
    $impl.Adjacent = function (card1, card2, bits, MayHave) {
      var Result = false;
      var lo = 0;
      var hi = 0;
      var middle = 0;
      if (pas.DecOnMac.pColorOf[card1] !== pas.DecOnMac.pColorOf[card2]) {
        Result = false;
        return Result;
      };
      if (card1 > card2) {
        lo = card2;
        hi = card1;
      } else {
        lo = card1;
        hi = card2;
      };
      for (var $l = lo + 1, $end = hi - 1; $l <= $end; $l++) {
        middle = $l;
        if ((MayHave.get()[middle] & bits) > 0) {
          Result = false;
          return Result;
        };
      };
      Result = true;
      return Result;
    };
    $impl.BestDiff = function (level, trickCard, trickColor, trickValue, pointsNeeded, numPlayed, totPlayers, fPlayer, MayHave, selHand) {
      var Result = 0;
      var first = false;
      var i = 0;
      var totalpoints = 0;
      var card = 0;
      var bestcard = 0;
      var bestplay = 0;
      var lowdiff = 0.0;
      var diff = 0.0;
      first = trickValue === -1;
      if (first) trickValue = 0;
      totalpoints = 5;
      for (card = 0; card <= 35; card++) {
        if (MayHave.get()[card] > 0) totalpoints = totalpoints + pas.DecOnMac.pValueOfCard[card];
      };
      lowdiff = 1000;
      for (var $l = selHand.fNum - 1; $l >= 0; $l--) {
        i = $l;
        card = selHand.fCard[i];
        if (first) {
          trickColor = pas.DecOnMac.pColorOf[card];
          bestcard = card;
        } else {
          bestcard = trickCard;
          if (pas.DecOnMac.PBetterCard(card,bestcard)) bestcard = card;
        };
        diff = $mod.StartWorstDiff(level,MayHave,fPlayer,trickColor,card,bestcard,pointsNeeded,trickValue + pas.DecOnMac.pValueOfCard[card],totalpoints,numPlayed,totPlayers);
        if (diff < lowdiff) {
          lowdiff = diff;
          bestplay = card;
        };
      };
      Result = bestplay;
      return Result;
    };
  };
},["DiffBase","DiffCmds"]);
rtl.module("RGEnd",["System","DecOnMac","DiffBase","RGLearn","RGTrick"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"TGrumpy",function () {
    this.numCard = 0;
    this.trumpProbIndex = 0;
    this.playedTrumps = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.ColorPoints = rtl.arraySetLength(null,0,4);
      r.RestCards = rtl.arraySetLength(null,0,4);
      r.totalPoints = rtl.arraySetLength(null,0,4);
      r.PlayedCard = rtl.arraySetLength(null,0,36);
      r.TrickWinner = rtl.arraySetLength(null,0,12);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.ColorPoints,b.ColorPoints) && rtl.arrayEq(this.RestCards,b.RestCards) && rtl.arrayEq(this.totalPoints,b.totalPoints) && (this.numCard === b.numCard) && rtl.arrayEq(this.PlayedCard,b.PlayedCard) && rtl.arrayEq(this.TrickWinner,b.TrickWinner) && (this.trumpProbIndex === b.trumpProbIndex) && (this.playedTrumps === b.playedTrumps);
    };
    this.$assign = function (s) {
      this.ColorPoints = s.ColorPoints.slice(0);
      this.RestCards = s.RestCards.slice(0);
      this.totalPoints = s.totalPoints.slice(0);
      this.numCard = s.numCard;
      this.PlayedCard = s.PlayedCard.slice(0);
      this.TrickWinner = s.TrickWinner.slice(0);
      this.trumpProbIndex = s.trumpProbIndex;
      this.playedTrumps = s.playedTrumps;
      return this;
    };
    var $r = $mod.$rtti.$Record("TGrumpy",{},this);
    $r.addField("ColorPoints",pas.RGLearn.$rtti["TPointArray"]);
    $r.addField("RestCards",pas.RGLearn.$rtti["TPointArray"]);
    $r.addField("totalPoints",pas.RGLearn.$rtti["TPointArray"]);
    $r.addField("numCard",rtl.longint);
    $mod.$rtti.$StaticArray("TGrumpy.PlayedCard$a",{dims: [36], eltype: rtl.longint});
    $r.addField("PlayedCard",$mod.$rtti["TGrumpy.PlayedCard$a"]);
    $mod.$rtti.$StaticArray("TGrumpy.TrickWinner$a",{dims: [12], eltype: rtl.longint});
    $r.addField("TrickWinner",$mod.$rtti["TGrumpy.TrickWinner$a"]);
    $r.addField("trumpProbIndex",rtl.longint);
    $r.addField("playedTrumps",rtl.longint);
  });
  this.$rtti.$Pointer("TGrumpyP",{reftype: this.$rtti["TGrumpy"]});
  this.BestPlay = function (IsGrumpy, Levels, global, local) {
    var Result = 0;
    var Expect = rtl.arraySetLength(null,0.0,9);
    var player = 0;
    var best = 0.0;
    var DistribSeq = rtl.arraySetLength(null,0,3);
    var allcards = 0;
    var totalcount = 0;
    var sample = 0;
    var which = 0;
    var i = 0;
    var j = 0;
    var k = 0;
    var depth = 0;
    var tried = 0;
    var accepted = 0;
    var totalPoints = rtl.arraySetLength(null,0,4);
    var callPoints = rtl.arraySetLength(null,0,4);
    var Allhands = rtl.arraySetLength(null,pas.DecOnMac.DHand,4);
    var temp = null;
    function FindExpect(trickpoints, leadcolor, stichcard, stichplayer, player) {
      var Result = 0.0;
      var legal = pas.DecOnMac.DHand.$new();
      var i = 0;
      var expect = 0;
      var lastexpect = 0;
      var legalcount = 0;
      var player2 = 0;
      var nextplayer = 0;
      var winner = 0;
      var lastwinner = 0;
      var lastplayer = 0;
      var thiscard = 0;
      var lastcard = 0;
      var finalcard = 0;
      var tempcard = 0;
      var best = 0.0;
      var diff = 0.0;
      function MyLegalHand(hand) {
        var i = 0;
        var none = false;
        legal.$assign(hand);
        none = true;
        if (leadcolor === 0) {
          for (var $l = 0, $end = hand.fNum; $l <= $end; $l++) {
            i = $l;
            if (hand.fCard[i] < 9) {
              none = none && (hand.fCard[i] === 8);
            } else {
              legal.fCard[i] = -1;
            };
          };
        } else if (stichcard < 9) {
          for (var $l1 = 0, $end1 = hand.fNum; $l1 <= $end1; $l1++) {
            i = $l1;
            if (pas.DecOnMac.pColorOf[hand.fCard[i]] === leadcolor) {
              none = false;
            } else if (!pas.DecOnMac.PBetterCard(hand.fCard[i],stichcard)) {
              legal.fCard[i] = -1;
            };
          };
        } else {
          for (var $l2 = 0, $end2 = hand.fNum; $l2 <= $end2; $l2++) {
            i = $l2;
            if (pas.DecOnMac.pColorOf[hand.fCard[i]] === leadcolor) {
              none = false;
            } else if (hand.fCard[i] >= 9) {
              legal.fCard[i] = -1;
            };
          };
        };
        if (none) legal.$assign(hand);
      };
      depth += 1;
      best = 0;
      Allhands[player].fNum -= 1;
      lastcard = Allhands[player].fCard[Allhands[player].fNum];
      legalcount = 0;
      nextplayer = global.fRules.fNextPlayer[player];
      if ((depth % global.fRules.fNumPlayers) === 1) {
        legal.$assign(Allhands[player]);
        for (var $l = 0, $end = legal.fNum; $l <= $end; $l++) {
          i = $l;
          thiscard = legal.fCard[i];
          Allhands[player].fCard[i] = lastcard;
          diff = FindExpect(pas.DecOnMac.pValueOfCard[thiscard],pas.DecOnMac.pColorOf[thiscard],thiscard,player,nextplayer);
          Allhands[player].fCard[i] = thiscard;
          if (IsGrumpy[player]) {
            if ((diff < best) || (legalcount === 0)) best = diff;
          } else best = best + diff;
          legalcount += 1;
        };
      } else {
        MyLegalHand(Allhands[player]);
        for (var $l1 = 0, $end1 = legal.fNum; $l1 <= $end1; $l1++) {
          i = $l1;
          if (legal.fCard[i] >= 0) {
            thiscard = legal.fCard[i];
            Allhands[player].fCard[i] = lastcard;
            expect = trickpoints + pas.DecOnMac.pValueOfCard[thiscard];
            winner = stichplayer;
            if (pas.DecOnMac.PBetterCard(thiscard,stichcard)) winner = player;
            if ((depth % global.fRules.fNumPlayers) === 0) {
              totalPoints[winner] = totalPoints[winner] + expect;
              if (depth >= (36 - global.fRules.fNumPlayers)) {
                lastexpect = 5;
                lastwinner = winner;
                if (depth === (36 - global.fRules.fNumPlayers)) {
                  finalcard = Allhands[winner].fCard[0];
                  lastexpect = lastexpect + pas.DecOnMac.pValueOfCard[finalcard];
                  for (var $l2 = 1, $end2 = global.fRules.fNumPlayers - 1; $l2 <= $end2; $l2++) {
                    player2 = $l2;
                    lastplayer = (winner + player2) % global.fRules.fNumPlayers;
                    tempcard = Allhands[lastplayer].fCard[0];
                    lastexpect = lastexpect + pas.DecOnMac.pValueOfCard[tempcard];
                    if (pas.DecOnMac.PBetterCard(tempcard,finalcard)) {
                      finalcard = tempcard;
                      lastwinner = lastplayer;
                    };
                  };
                };
                totalPoints[lastwinner] = totalPoints[lastwinner] + lastexpect;
                diff = 0;
                for (var $l3 = 0, $end3 = global.fRules.fNumPlayers - 1; $l3 <= $end3; $l3++) {
                  player2 = $l3;
                  if (IsGrumpy[player2]) {
                    diff = diff + Math.abs(totalPoints[player2] - callPoints[player2])}
                   else if (callPoints[player2] >= 0) diff = diff - Math.abs(totalPoints[player2] - callPoints[player2]);
                };
                totalPoints[lastwinner] = totalPoints[lastwinner] - lastexpect;
              } else {
                diff = FindExpect(0,0,0,0,winner);
              };
              totalPoints[winner] = totalPoints[winner] - expect;
            } else {
              finalcard = stichcard;
              if (winner === player) finalcard = thiscard;
              diff = FindExpect(expect,leadcolor,finalcard,winner,nextplayer);
            };
            Allhands[player].fCard[i] = thiscard;
            if (IsGrumpy[player]) {
              if ((diff < best) || (legalcount === 0)) best = diff;
            } else best = best + diff;
            legalcount += 1;
          };
        };
      };
      Allhands[player].fNum += 1;
      depth -= 1;
      if (IsGrumpy[player]) {
        Result = best}
       else Result = best / legalcount;
      return Result;
    };
    function Distribute(Cards, whichplayer) {
      var NewCards = rtl.arraySetLength(null,0,36);
      var allcards = 0;
      var thiscard = 0;
      var needed = 0;
      var count = 0;
      var sure = 0;
      var where = 0;
      var which = 0;
      var i = 0;
      var j = 0;
      var Selected = rtl.arraySetLength(null,0,36);
      var List = rtl.arraySetLength(null,0,36);
      var max = 0;
      var newstich = 0;
      var newstichplayer = 0;
      var newtrickvalue = 0;
      var who = 0;
      var TempHave = rtl.arraySetLength(null,0,36);
      var thishand = pas.DecOnMac.DHand.$new();
      var trickcard = 0;
      var wouldPlay = 0;
      var trickcolor = 0;
      var trickwinner = 0;
      var trickvalue = 0;
      var pointsNeeded = 0;
      var beforePoints = 0;
      var selHand = pas.DecOnMac.DHand.$new();
      var ok = false;
      if (whichplayer === (global.fRules.fNumPlayers - 1)) {
        if (totalcount === sample) {
          totalcount = -1;
          depth += 1;
          max = local.fLegal.fNum - 1;
          for (var $l = 0, $end = max; $l <= $end; $l++) {
            allcards = $l;
            thiscard = local.fLegal.fCard[allcards];
            newstich = global.fRound.fTrickCard;
            newstichplayer = global.fRound.fTrickOwner;
            if (pas.DecOnMac.PBetterCard(thiscard,newstich)) {
              newstich = thiscard;
              newstichplayer = local.fPlayer;
            };
            newtrickvalue = global.fRound.fTrickValue + pas.DecOnMac.pValueOfCard[thiscard];
            for (var $l1 = 0, $end1 = Allhands[local.fPlayer].fNum - 1; $l1 <= $end1; $l1++) {
              j = $l1;
              if (Allhands[local.fPlayer].fCard[j] === thiscard) which = j;
            };
            Allhands[local.fPlayer].fCard[which] = Allhands[local.fPlayer].fCard[Allhands[local.fPlayer].fNum - 1];
            Allhands[local.fPlayer].fNum -= 1;
            if ((depth % global.fRules.fNumPlayers) === 0) {
              totalPoints[newstichplayer] = totalPoints[newstichplayer] + newtrickvalue;
              Expect[allcards] = Expect[allcards] + FindExpect(0,0,0,0,newstichplayer);
              totalPoints[newstichplayer] = totalPoints[newstichplayer] - newtrickvalue;
            } else if ((depth % global.fRules.fNumPlayers) === 1) {
              Expect[allcards] = Expect[allcards] + FindExpect(pas.DecOnMac.pValueOfCard[thiscard],pas.DecOnMac.pColorOf[thiscard],thiscard,local.fPlayer,global.fRules.fNextPlayer[local.fPlayer]);
            } else {
              Expect[allcards] = Expect[allcards] + FindExpect(newtrickvalue,global.fRound.fTrickColor,newstich,newstichplayer,global.fRules.fNextPlayer[local.fPlayer]);
            };
            Allhands[local.fPlayer].fCard[which] = thiscard;
            Allhands[local.fPlayer].fNum += 1;
          };
          depth -= 1;
        };
        totalcount += 1;
      } else {
        who = DistribSeq[whichplayer];
        count = 0;
        sure = 0;
        for (allcards = 0; allcards <= 35; allcards++) if ((Cards[allcards] & pas.DecOnMac.pBit[who]) > 0) {
          if (Cards[allcards] === pas.DecOnMac.pBit[who]) {
            Allhands[who].fCard[sure] = allcards;
            sure += 1;
          } else {
            List[count] = allcards;
            count += 1;
          };
        };
        needed = rtl.trunc(36 / global.fRules.fNumPlayers) - global.fRound.fPlayed[who].fNum - sure;
        Allhands[who].fNum = sure + needed;
        if (needed <= count) {
          NewCards = Cards.slice(0);
          for (var $l2 = 0, $end2 = needed - 1; $l2 <= $end2; $l2++) {
            allcards = $l2;
            Selected[allcards] = allcards;
          };
          do {
            for (var $l3 = 0, $end3 = count - 1; $l3 <= $end3; $l3++) {
              allcards = $l3;
              NewCards[List[allcards]] = Cards[List[allcards]] & (15 - pas.DecOnMac.pBit[who]);
            };
            for (var $l4 = 0, $end4 = needed - 1; $l4 <= $end4; $l4++) {
              allcards = $l4;
              thiscard = List[Selected[allcards]];
              Allhands[who].fCard[sure + allcards] = thiscard;
              NewCards[thiscard] = pas.DecOnMac.pBit[who];
            };
            ok = true;
            beforePoints = callPoints[who];
            if (IsGrumpy[who]) {
              tried = tried + 1;
              for (allcards = 0; allcards <= 35; allcards++) TempHave[allcards] = 15 - pas.DecOnMac.pBit[who];
              thishand.$assign(global.fRound.fPlayed[who]);
              for (var $l5 = 0, $end5 = thishand.fNum - 1; $l5 <= $end5; $l5++) {
                allcards = $l5;
                TempHave[thishand.fCard[allcards]] = pas.DecOnMac.pBit[who];
              };
              thishand.$assign(Allhands[who]);
              for (var $l6 = 0, $end6 = thishand.fNum - 1; $l6 <= $end6; $l6++) {
                allcards = $l6;
                TempHave[thishand.fCard[allcards]] = pas.DecOnMac.pBit[who];
              };
              TempHave[global.fOpenCard] = pas.DecOnMac.pBit[global.fRules.fPrevPlayer[global.fBegins]];
              callPoints[who] = pas.RGLearn.Call(global.fRules.fNumPlayers,who,{get: function () {
                  return TempHave;
                }, set: function (v) {
                  TempHave = v;
                }});
              ok = (beforePoints === -1) || (beforePoints === callPoints[who]);
            };
            if (ok) Distribute(NewCards.slice(0),whichplayer + 1);
            callPoints[who] = beforePoints;
            where = needed - 1;
            while ((where >= 0) && (((Selected[where] + needed) - where) >= count)) where -= 1;
            if (where >= 0) {
              Selected[where] = Selected[where] + 1;
              while ((where + 1) < needed) {
                where += 1;
                Selected[where] = Selected[where - 1] + 1;
              };
            };
          } while (!(where < 0));
        };
      };
    };
    temp = local.fPrivate;
    for (var $l = 0, $end = local.fLegal.fNum - 1; $l <= $end; $l++) {
      allcards = $l;
      Expect[allcards] = 0;
    };
    for (var $l1 = 0, $end1 = global.fRules.fNumPlayers - 1; $l1 <= $end1; $l1++) {
      player = $l1;
      totalPoints[player] = global.fRound.fPoints[player];
      callPoints[player] = local.fCall[player];
    };
    Allhands[local.fPlayer].$assign(local.fHand);
    j = 0;
    k = global.fRules.fNumPlayers - 2;
    for (var $l2 = 0, $end2 = global.fRules.fNumPlayers - 1; $l2 <= $end2; $l2++) {
      i = $l2;
      player = (local.fPlayer + 2 + i) % global.fRules.fNumPlayers;
      if (player !== local.fPlayer) {
        if (IsGrumpy[player]) {
          DistribSeq[j] = player;
          j += 1;
        } else {
          DistribSeq[k] = player;
          k -= 1;
        };
      };
    };
    totalcount = 0;
    sample = 0;
    depth = global.fRound.fNumPlayed;
    if (depth < 26) sample = 2147483647;
    tried = 0;
    accepted = 0;
    Distribute(local.fMayHave,0);
    if (sample === 2147483647) {
      if (depth < 24) {
        sample = rtl.trunc(totalcount / 20)}
       else sample = rtl.trunc(totalcount / 50);
      totalcount = 0;
      Distribute(local.fMayHave,0);
    };
    best = Expect[0];
    which = 0;
    for (var $l3 = 1, $end3 = local.fLegal.fNum - 1; $l3 <= $end3; $l3++) {
      allcards = $l3;
      if (Expect[allcards] < best) {
        best = Expect[allcards];
        which = allcards;
      };
    };
    Result = local.fLegal.fCard[which];
    return Result;
  };
  $mod.$implcode = function () {
    $impl.FullLegalHand = function (lead, leadcolor, stichcard, fPlayer, MayHave, legal) {
      var i = 0;
      var j = 0;
      var none = false;
      var hand = pas.DecOnMac.DHand.$new();
      j = 0;
      for (i = 0; i <= 35; i++) if (MayHave.get()[i] === pas.DecOnMac.pBit[fPlayer]) {
        hand.fCard[j] = i;
        j += 1;
      };
      hand.fNum = j;
      legal.$assign(hand);
      if (!lead) {
        none = true;
        if (leadcolor === 0) {
          for (var $l = 0, $end = hand.fNum - 1; $l <= $end; $l++) {
            i = $l;
            if (hand.fCard[i] < 9) {
              none = none && (hand.fCard[i] === 8);
            } else {
              legal.fCard[i] = -1;
            };
          };
        } else if (stichcard < 9) {
          for (var $l1 = 0, $end1 = hand.fNum - 1; $l1 <= $end1; $l1++) {
            i = $l1;
            if (pas.DecOnMac.pColorOf[hand.fCard[i]] === leadcolor) {
              none = false;
            } else if (!pas.DecOnMac.PBetterCard(hand.fCard[i],stichcard)) {
              legal.fCard[i] = -1;
            };
          };
        } else {
          for (var $l2 = 0, $end2 = hand.fNum - 1; $l2 <= $end2; $l2++) {
            i = $l2;
            if (pas.DecOnMac.pColorOf[hand.fCard[i]] === leadcolor) {
              none = false;
            } else if (hand.fCard[i] >= 9) {
              legal.fCard[i] = -1;
            };
          };
        };
        if (none) legal.$assign(hand);
        j = 0;
        for (var $l3 = 0, $end3 = legal.fNum - 1; $l3 <= $end3; $l3++) {
          i = $l3;
          if (legal.fCard[i] >= 0) {
            legal.fCard[j] = legal.fCard[i];
            j += 1;
          };
        };
        legal.fNum = j;
      };
    };
  };
},[]);
rtl.module("RGPlay",["System","DecOnMac","RGTrick","RGEnd","RGLearn"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.rg_create = function () {
    var Result = null;
    var self = null;
    self = pas.RGEnd.TGrumpy.$new();
    Result = self;
    return Result;
  };
  this.rg_destroy = function (s) {
    var self = null;
    self = s;
    self = null;
  };
  this.rg_not_deal = function (local) {
    var temp = null;
    var color = 0;
    temp = local.fPrivate;
    temp.numCard = 0;
    for (color = 0; color <= 3; color++) {
      temp.ColorPoints[color] = 0;
      temp.RestCards[color] = 0;
      temp.totalPoints[color] = 0;
    };
  };
  this.rg_not_count = function (global, local, snapfile) {
    var i = 0;
    var j = 0;
    var trickwincolor = 0;
    var made = 0;
    var cnt = 0;
    var lo = 0.0;
    var hi = 0.0;
    var temp = null;
    if (global.fRules.fNumPlayers === 4) {
      temp = local.fPrivate;
      made = local.fCall[local.fPlayer];
      for (i = 0; i <= 8; i++) {
        trickwincolor = pas.DecOnMac.pColorOf[global.fRound.fPlayed[temp.TrickWinner[i]].fCard[i]];
        if ((i === 8) && (temp.TrickWinner[i] === local.fPlayer)) made = made - 5;
        for (var $l = 4 * i, $end = (4 * i) + 3; $l <= $end; $l++) {
          j = $l;
          if (temp.TrickWinner[i] === local.fPlayer) {
            made = made - pas.DecOnMac.pValueOfCard[temp.PlayedCard[j]];
            if (pas.DecOnMac.pColorOf[temp.PlayedCard[j]] === trickwincolor) {
              temp.ColorPoints[trickwincolor] = temp.ColorPoints[trickwincolor] - pas.DecOnMac.pValueOfCard[temp.PlayedCard[j]]}
             else temp.RestCards[trickwincolor] = temp.RestCards[trickwincolor] - 1;
          };
        };
      };
    };
  };
  this.rg_req_call = function (global, local) {
    var Result = 0;
    Result = pas.RGLearn.Call(global.fRules.fNumPlayers,local.fPlayer,{p: local, get: function () {
        return this.p.fMayHave;
      }, set: function (v) {
        this.p.fMayHave = v;
      }});
    return Result;
  };
  this.rg_not_call = function (global, local, player) {
  };
  this.rg_req_card = function (IsGrumpy, Levels, global, local, snapfile) {
    var Result = 0;
    var pointsNeeded = 0;
    var i = 0;
    var card = 0;
    var temp = pas.DecOnMac.DHand.$new();
    temp.$assign(local.fLegal);
    pointsNeeded = local.fCall[local.fPlayer] - global.fRound.fPoints[local.fPlayer];
    if (local.fLegal.fNum > 1) pas.RGTrick.ProvableReduction(global.fRound.fTrickCard,global.fRound.fTrickValue,global.fRound.fNumPlayed,global.fRules.fNumPlayers,local.fPlayer,{p: local, get: function () {
        return this.p.fMayHave;
      }, set: function (v) {
        this.p.fMayHave = v;
      }},local.fLegal,pointsNeeded);
    if ((local.fLegal.fNum > 1) && (global.fRound.fNumPlayed >= 26)) {
      card = pas.RGEnd.BestPlay(IsGrumpy.slice(0),Levels.slice(0),global,local);
    } else {
      if (local.fLegal.fNum > 1) pas.RGTrick.HeuristicReduction(global.fRound.fTrickCard,global.fRound.fTrickValue,global.fRound.fNumPlayed,global.fRules.fNumPlayers,local.fPlayer,{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},local.fLegal,pointsNeeded);
      if (local.fLegal.fNum === 1) {
        card = local.fLegal.fCard[0];
      } else if (global.fRound.fInTrick === 0) {
        card = pas.RGTrick.BestLeadPlay(Levels[local.fPlayer],global.fRound.fNumPlayed,global.fRules.fNumPlayers,local.fPlayer,{p: local, get: function () {
            return this.p.fMayHave;
          }, set: function (v) {
            this.p.fMayHave = v;
          }},local.fLegal,pointsNeeded);
      } else {
        card = pas.RGTrick.BestNonLeadCard(Levels[local.fPlayer],global.fRound.fTrickCard,global.fRound.fTrickColor,global.fRound.fTrickValue,pointsNeeded,global.fRound.fNumPlayed,global.fRules.fNumPlayers,local.fPlayer,{p: local, get: function () {
            return this.p.fMayHave;
          }, set: function (v) {
            this.p.fMayHave = v;
          }},local.fLegal);
      };
    };
    Result = card;
    for (var $l = 0, $end = temp.fNum - 1; $l <= $end; $l++) {
      i = $l;
      if (card === temp.fCard[i]) {
        return Result;
      };
    };
    return Result;
  };
  this.rg_not_card = function (global, local, player, card) {
    var temp = null;
    var takecolor = 0;
    var i = 0;
    var bits = 0;
    var nrTrumps = 0;
    var played = 0;
    var nrPlayers = 0;
    temp = local.fPrivate;
    temp.PlayedCard[temp.numCard] = card;
    temp.numCard += 1;
    if ((temp.numCard % global.fRules.fNumPlayers) === 0) {
      temp.TrickWinner[rtl.trunc(temp.numCard / global.fRules.fNumPlayers) - 1] = global.fRound.fTrickOwner;
      takecolor = pas.DecOnMac.pColorOf[global.fRound.fTrickCard];
      if (global.fRound.fTrickOwner === local.fPlayer) {
        if (temp.numCard === 36) temp.totalPoints[takecolor] = temp.totalPoints[takecolor] + 5;
        for (var $l = temp.numCard - global.fRules.fNumPlayers, $end = temp.numCard - 1; $l <= $end; $l++) {
          i = $l;
          temp.totalPoints[takecolor] = temp.totalPoints[takecolor] + pas.DecOnMac.pValueOfCard[temp.PlayedCard[i]];
          if (pas.DecOnMac.pColorOf[temp.PlayedCard[i]] === takecolor) {
            temp.ColorPoints[takecolor] = temp.ColorPoints[takecolor] + pas.DecOnMac.pValueOfCard[temp.PlayedCard[i]]}
           else temp.RestCards[takecolor] = temp.RestCards[takecolor] + 1;
        };
      };
    };
  };
  this.rg_Init = function () {
    pas.RGLearn.InitLearnValues();
  };
  this.rg_Free = function () {
  };
  $mod.$implcode = function () {
    $impl.IsBock = function (card, bits, MayHave) {
      var Result = false;
      var better = 0;
      var high = 0;
      high = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[card],8);
      for (var $l = card + 1, $end = high; $l <= $end; $l++) {
        better = $l;
        if ((MayHave.get()[better] & bits) > 0) {
          Result = false;
          return Result;
        };
      };
      Result = true;
      return Result;
    };
    $impl.Adjacent = function (card1, card2, bits, MayHave) {
      var Result = false;
      var lo = 0;
      var hi = 0;
      var middle = 0;
      if (pas.DecOnMac.pColorOf[card1] !== pas.DecOnMac.pColorOf[card2]) {
        Result = false;
        return Result;
      };
      if (card1 > card2) {
        lo = card2;
        hi = card1;
      } else {
        lo = card1;
        hi = card2;
      };
      for (var $l = lo + 1, $end = hi - 1; $l <= $end; $l++) {
        middle = $l;
        if ((MayHave.get()[middle] & bits) > 0) {
          Result = false;
          return Result;
        };
      };
      Result = true;
      return Result;
    };
  };
},[]);
rtl.module("rgJasser",["System"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.InitGrumpyJasser = function () {
    var aGloon = null;
    pas.RGLearn.grgRnd = pas.DiffBase.NewRnd("Grumpy Junior");
    pas.RGPlay.rg_Init();
    aGloon = $impl.TGrumpyObj.$create("IJassHandler$2",[0]);
    pas.DiffPlay.DeclareHandler(aGloon,"Grumpy Junior");
  };
  this.FreeGrumpyJasser = function () {
    pas.RGPlay.rg_Free();
  };
  $mod.$implcode = function () {
    rtl.createClass($impl,"TGrumpyObj",pas.Jassers.TProtoJasser,function () {
      this.$init = function () {
        pas.Jassers.TProtoJasser.$init.call(this);
        this.fRandom = false;
        this.fMySnap = 0;
        this.fNuSnap = 0;
        this.fMinDelta = 0;
        this.fIsGrumpy = rtl.arraySetLength(null,false,4);
        this.fLevels = rtl.arraySetLength(null,0,4);
        this.trump = 0;
        this.global = pas.DecOnMac.TGlobal.$new();
        this.local = pas.DecOnMac.TLocal.$new();
        this.cardToLocal = rtl.arraySetLength(null,0,37);
        this.cardToGlobal = rtl.arraySetLength(null,0,36);
      };
      this.$final = function () {
        this.fIsGrumpy = undefined;
        this.fLevels = undefined;
        this.global = undefined;
        this.local = undefined;
        this.cardToLocal = undefined;
        this.cardToGlobal = undefined;
        pas.Jassers.TProtoJasser.$final.call(this);
      };
      this.IJassHandler$2 = function (player) {
        var saveRes = 0;
        var count = 0;
        pas.Jassers.TProtoJasser.IJassHandler$1.call(this,player);
        this.fRandom = false;
        this.fMySnap = 0;
        this.fNuSnap = 0;
        this.fMinDelta = 0;
        this.fSayIcon = 9100 + 1;
        this.local.fPrivate = pas.RGPlay.rg_create();
        return this;
      };
      this.NewInstance = function (player) {
        var Result = null;
        var aGloon = null;
        aGloon = $impl.TGrumpyObj.$create("IJassHandler$2",[player]);
        Result = aGloon;
        return Result;
      };
      this.About = function () {
      };
      this.Edit = function () {
        var line = "";
        var name = "";
        var done = false;
        var ident = "";
        var index = 0;
      };
      this.HandleRequest = function (aReq, answer) {
        var playC = null;
        var i = 0;
        var c = 0;
        pas.DiffCmds.InitCommand(answer,0);
        var $tmp = aReq.fCmdID;
        if ($tmp === 2002) {
          pas.DiffCmds.InitCommand(answer,2002);
          answer.fCData.fPlayer = this.fPlayer;
          if (this.fRandom) {
            answer.fCData.fCall = pas.DiffBase.Rnd(pas.RGLearn.grgRnd,true) % 158}
           else answer.fCData.fCall = pas.RGPlay.rg_req_call(this.global,this.local);
        } else if ($tmp === 2003) {
          playC = aReq.fCData;
          pas.DiffCmds.InitCommand(answer,2004);
          answer.fCData.fPlayer = this.fPlayer;
          if (this.fRandom) {
            i = 0;
            c = 0;
            while (i <= 11) {
              if (playC.fLegal[i] !== 0) c = c + 1;
              i = i + 1;
            };
            c = pas.DiffBase.Rnd(pas.RGLearn.grgRnd,true) % pas.StdUtils.Maxi(c,1);
            i = 0;
            while ((i <= 11) && (c >= 0)) {
              if (playC.fLegal[i] !== 0) c = c - 1;
              i = i + 1;
            };
            answer.fCData.fCard = playC.fLegal[i - 1];
          } else {
            this.HandToLocal(this.local.fHand,playC.fHand);
            this.HandToLocal(this.local.fLegal,playC.fLegal);
            answer.fCData.fCard = this.cardToGlobal[pas.RGPlay.rg_req_card(this.fIsGrumpy.slice(0),this.fLevels.slice(0),this.global,this.local,this.fMySnap)];
          };
        } else if ($tmp === 2020) {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        } else {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        };
      };
      this.NotifyCommand = function (aCmd) {
        var d = null;
        var n = null;
        var Call = null;
        var ca = null;
        var i = 0;
        var r = 0;
        var col = 0;
        var lcol = 0;
        var card = 0;
        var player = 0;
        var mine = 0;
        var allOthers = 0;
        pas.Jassers.TProtoJasser.NotifyCommand.call(this,pas.DiffCmds.TCommand.$clone(aCmd));
        var $tmp = aCmd.fCmdID;
        if ($tmp === 1100) {
          n = aCmd.fCData;
          var $with = this.global.fRules;
          $with.fNumPlayers = n.fRules.fNuPlayers;
          $with.fNextPlayer[3] = 3;
          $with.fPrevPlayer[3] = 3;
          for (var $l = 0, $end = $with.fNumPlayers - 1; $l <= $end; $l++) {
            i = $l;
            $with.fNextPlayer[i] = (i + 1) % $with.fNumPlayers;
          };
          for (var $l1 = 0, $end1 = $with.fNumPlayers - 1; $l1 <= $end1; $l1++) {
            i = $l1;
            $with.fPrevPlayer[$with.fNextPlayer[i]] = i;
          };
          $with.fBonus = n.fRules.fDZeroBonus;
          $with.fBonusNullTrick = 0;
          $with.fOpenCalls = false;
          for (player = 0; player <= 3; player++) {
            this.fIsGrumpy[player] = n.fTypes[player + 1] === n.fTypes[n.fPlayer];
            this.fLevels[player] = n.fLevel[player + 1];
          };
        } else if ($tmp === 2000) {
          d = aCmd.fCData;
          this.trump = pas.DiffBase.gColourOf[d.fDrawn];
          for (r = 1; r <= 9; r++) {
            this.cardToLocal[pas.DiffBase.gCardOf[this.trump][r]] = pas.DiffBase.TrumpRank(r) - 1;
            this.cardToGlobal[pas.DiffBase.TrumpRank(r) - 1] = pas.DiffBase.gCardOf[this.trump][r];
          };
          lcol = 0;
          for (col = 1; col <= 4; col++) if (col !== this.trump) {
            lcol = lcol + 1;
            for (r = 1; r <= 9; r++) {
              this.cardToLocal[pas.DiffBase.gCardOf[col][r]] = ((lcol * 9) + r) - 1;
              this.cardToGlobal[((lcol * 9) + r) - 1] = pas.DiffBase.gCardOf[col][r];
            };
          };
          var $with1 = this.global.fRound;
          for (i = 0; i <= 3; i++) $with1.fPoints[i] = 0;
          for (i = 0; i <= 3; i++) $with1.fMadeTrick[i] = false;
          $with1.fNumPlayed = 0;
          $with1.fInTrick = 0;
          for (i = 0; i <= 3; i++) $with1.fPlayed[i].fNum = 0;
          this.global.fOpenCard = this.cardToLocal[d.fDrawn];
          this.global.fBegins = d.fDrawnFor % this.global.fRules.fNumPlayers;
          for (i = 0; i <= 3; i++) this.global.fTotal[i] = d.fTotal[i + 1];
          var $with2 = this.local;
          $with2.fPlayer = this.fPlayer - 1;
          this.HandToLocal($with2.fHandDealt,d.fHands[this.fPlayer].slice(0));
          $with2.fHand.$assign($with2.fHandDealt);
          $with2.fLegal.$assign($with2.fHandDealt);
          mine = pas.DecOnMac.pBit[$with2.fPlayer];
          if (this.global.fRules.fNumPlayers === 4) {
            allOthers = 15}
           else allOthers = 7;
          for (var $l2 = 35; $l2 >= 0; $l2--) {
            card = $l2;
            $with2.fMayHave[card] = allOthers - mine;
          };
          for (var $l3 = 0, $end2 = $with2.fHand.fNum - 1; $l3 <= $end2; $l3++) {
            i = $l3;
            $with2.fMayHave[$with2.fHand.fCard[i]] = mine;
          };
          $with2.fMayHave[this.global.fOpenCard] = pas.DecOnMac.pBit[d.fDrawnFor - 1];
          for (i = 0; i <= 3; i++) $with2.fCall[i] = -1;
          pas.RGPlay.rg_not_deal(this.local);
        } else if ($tmp === 2004) {
          ca = aCmd.fCData;
          player = ca.fPlayer - 1;
          card = this.cardToLocal[ca.fCard];
          if (ca.fPlayer === this.fPlayer) {
            var $with3 = this.local.fHand;
            $with3.fNum = $with3.fNum - 1;
            i = $with3.fNum;
            while ($with3.fCard[i] !== card) i = i - 1;
            $with3.fCard[i] = $with3.fCard[$with3.fNum];
          };
          var $with4 = this.global.fRound;
          $with4.fPlayed[player].fCard[$with4.fPlayed[player].fNum] = card;
          $with4.fPlayed[player].fNum = $with4.fPlayed[player].fNum + 1;
          $with4.fNumPlayed = $with4.fNumPlayed + 1;
          $with4.fInTrick = $with4.fNumPlayed % this.global.fRules.fNumPlayers;
          if ($with4.fInTrick === 1) {
            $with4.fTrickColor = pas.DecOnMac.pColorOf[card];
            $with4.fTrickCard = card;
            $with4.fTrickOwner = player;
            if ($with4.fNumPlayed >= 33) {
              $with4.fTrickValue = 5}
             else $with4.fTrickValue = 0;
          } else {
            if (pas.DecOnMac.PBetterCard(card,$with4.fTrickCard)) {
              $with4.fTrickCard = card;
              $with4.fTrickOwner = player;
            };
          };
          $with4.fTrickValue = $with4.fTrickValue + pas.DecOnMac.pValueOfCard[card];
          if ($with4.fInTrick === 0) {
            $with4.fPoints[$with4.fTrickOwner] = $with4.fPoints[$with4.fTrickOwner] + $with4.fTrickValue;
            $with4.fMadeTrick[$with4.fTrickOwner] = true;
          };
          $with4.fTrickPlayer = player;
          pas.RGTrick.UpdateMayHave(this.global.fRound.fNumPlayed,this.global.fRules.fNumPlayers,card,this.global.fRound.fTrickCard,this.global.fRound.fTrickColor,player,{p: this.local, get: function () {
              return this.p.fMayHave;
            }, set: function (v) {
              this.p.fMayHave = v;
            }});
          pas.RGPlay.rg_not_card(this.global,this.local,player,card);
        } else if ($tmp === 2002) {
          Call = aCmd.fCData;
          this.local.fCall[Call.fPlayer - 1] = Call.fCall;
          pas.RGPlay.rg_not_call(this.global,this.local,Call.fPlayer - 1);
        } else if ($tmp === 2005) {
          pas.RGPlay.rg_not_count(this.global,this.local,this.fMySnap);
        };
      };
      this.Free$1 = function () {
        if (this.fMySnap !== 0) pas.WinFile.CloseWinFile(this.fMySnap);
        pas.DiffPlay.TJassHandler.Free$1.call(this);
      };
      this.HandToLocal = function (lhand, hand) {
        var i = 0;
        lhand.fNum = 0;
        for (i = 0; i <= 11; i++) if (hand[i] !== 0) {
          lhand.fCard[lhand.fNum] = this.cardToLocal[hand[i]];
          lhand.fNum = lhand.fNum + 1;
        };
      };
      var $r = this.$rtti;
      $mod.$rtti.$StaticArray("TGrumpyObj.cardToLocal$a",{dims: [37], eltype: pas.DecOnMac.$rtti["DCard"]});
      $mod.$rtti.$StaticArray("TGrumpyObj.cardToGlobal$a",{dims: [36], eltype: pas.DiffBase.$rtti["TCard"]});
    });
  };
},["DiffBase","DiffCmds","DiffNet","DiffPlay","Jassers","ResUtils","StdUtils","WinFile","DecOnMac","RGTrick","RGLearn","RGPlay"]);
rtl.module("Hend",["System","DecOnMac"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.h_endgame = function (global, local) {
    var Result = 0;
    var e = $impl.TEndgameInfo.$new();
    var P = 0;
    var x = 0;
    var y = 0;
    var i = 0;
    var allLeg = false;
    var card = 0;
    var minval = 0.0;
    var mini = 0;
    e.fGlobal = global;
    e.fLocal = local;
    e.player = local.fPlayer;
    for (var $l = 3; $l >= 0; $l--) {
      i = $l;
      e.nextPlayer[i] = global.fRules.fNextPlayer[i];
    };
    e.numPlayers = global.fRules.fNumPlayers;
    for (var $l1 = 35; $l1 >= 0; $l1--) {
      i = $l1;
      e.mayhave[i] = local.fMayHave[i];
    };
    for (var $l2 = e.numPlayers - 1; $l2 >= 0; $l2--) {
      P = $l2;
      e.hand[P].fNum = 0;
    };
    x = rtl.trunc((36 - global.fRound.fNumPlayed) / e.numPlayers);
    for (var $l3 = e.numPlayers - 1; $l3 >= 0; $l3--) {
      P = $l3;
      e.needs[P] = x;
      e.avail[P] = 0;
    };
    P = local.fPlayer;
    for (var $l4 = ((36 - global.fRound.fNumPlayed) % e.numPlayers) - 1; $l4 >= 0; $l4--) {
      i = $l4;
      e.needs[P] = e.needs[P] + 1;
      P = e.nextPlayer[P];
    };
    x = 0;
    y = 0;
    for (var $l5 = 35; $l5 >= 0; $l5--) {
      i = $l5;
      if (e.mayhave[i] > 0) {
        if ((e.mayhave[i] & (e.mayhave[i] - 1)) > 0) {
          e.card[x] = i;
          x = x + 1;
          for (var $l6 = e.numPlayers - 1; $l6 >= 0; $l6--) {
            P = $l6;
            if ((e.mayhave[i] & pas.DecOnMac.pBit[P]) > 0) e.avail[P] = e.avail[P] + 1;
          };
        } else {
          P = pas.DecOnMac.pSetToPlayer[e.mayhave[i]];
          e.mayhave[i] = 0;
          e.hand[P].fCard[e.hand[P].fNum] = i;
          e.hand[P].fNum = e.hand[P].fNum + 1;
          y = y + 1;
        };
      };
    };
    for (var $l7 = 35; $l7 >= 0; $l7--) {
      i = $l7;
      e.val[i] = 0;
      e.legal[i] = false;
    };
    e.round.$assign(global.fRound);
    allLeg = pas.DecOnMac.AllLegal(e.hand[e.player],e.round.fNumPlayed,e.numPlayers,e.round.fTrickColor);
    if (allLeg) {
      for (var $l8 = e.hand[e.player].fNum - 1; $l8 >= 0; $l8--) {
        i = $l8;
        e.legal[i] = true;
      };
    } else {
      for (var $l9 = e.hand[e.player].fNum - 1; $l9 >= 0; $l9--) {
        i = $l9;
        card = e.hand[e.player].fCard[i];
        if (pas.DecOnMac.AllowedCard(card,e.round.fTrickCard,e.round.fTrickColor)) {
          e.legal[i] = true;
        };
      };
    };
    e.numCards = x;
    e.consistent = false;
    $impl.IncludePlayer(e.nextPlayer[local.fPlayer],e,e.numCards);
    minval = 1E38;
    mini = 100;
    for (var $l10 = e.hand[e.player].fNum - 1; $l10 >= 0; $l10--) {
      i = $l10;
      if (e.legal[i] && (e.val[i] < minval)) {
        minval = e.val[i];
        mini = i;
      };
    };
    Result = e.hand[e.player].fCard[mini];
    return Result;
  };
  $mod.$implcode = function () {
    rtl.recNewT($impl,"TEndgameInfo",function () {
      this.fGlobal = null;
      this.fLocal = null;
      this.player = 0;
      this.numCards = 0;
      this.numPlayers = 0;
      this.consistent = false;
      this.$new = function () {
        var r = Object.create(this);
        r.nextPlayer = rtl.arraySetLength(null,0,4);
        r.mayhave = rtl.arraySetLength(null,0,36);
        r.needs = rtl.arraySetLength(null,0,4);
        r.avail = rtl.arraySetLength(null,0,4);
        r.card = rtl.arraySetLength(null,0,36);
        r.hand = rtl.arraySetLength(null,pas.DecOnMac.DHand,4);
        r.round = pas.DecOnMac.DRound.$new();
        r.legal = rtl.arraySetLength(null,false,36);
        r.val = rtl.arraySetLength(null,0.0,36);
        return r;
      };
      this.$eq = function (b) {
        return (this.fGlobal === b.fGlobal) && (this.fLocal === b.fLocal) && rtl.arrayEq(this.nextPlayer,b.nextPlayer) && (this.player === b.player) && rtl.arrayEq(this.mayhave,b.mayhave) && rtl.arrayEq(this.needs,b.needs) && rtl.arrayEq(this.avail,b.avail) && rtl.arrayEq(this.card,b.card) && (this.numCards === b.numCards) && (this.numPlayers === b.numPlayers) && rtl.arrayEq(this.hand,b.hand) && (this.consistent === b.consistent) && this.round.$eq(b.round) && rtl.arrayEq(this.legal,b.legal) && rtl.arrayEq(this.val,b.val);
      };
      this.$assign = function (s) {
        this.fGlobal = s.fGlobal;
        this.fLocal = s.fLocal;
        this.nextPlayer = s.nextPlayer.slice(0);
        this.player = s.player;
        this.mayhave = s.mayhave.slice(0);
        this.needs = s.needs.slice(0);
        this.avail = s.avail.slice(0);
        this.card = s.card.slice(0);
        this.numCards = s.numCards;
        this.numPlayers = s.numPlayers;
        this.hand = pas.DecOnMac.DHands$clone(s.hand);
        this.consistent = s.consistent;
        this.round.$assign(s.round);
        this.legal = s.legal.slice(0);
        this.val = s.val.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("TEndgameInfo",{},this);
      $r.addField("fGlobal",pas.DecOnMac.$rtti["TGlobalP"]);
      $r.addField("fLocal",pas.DecOnMac.$rtti["TLocalP"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.nextPlayer$a",{dims: [4], eltype: rtl.longint});
      $r.addField("nextPlayer",$mod.$rtti["TEndgameInfo.nextPlayer$a"]);
      $r.addField("player",pas.DecOnMac.$rtti["DPlayer"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.mayhave$a",{dims: [36], eltype: rtl.longint});
      $r.addField("mayhave",$mod.$rtti["TEndgameInfo.mayhave$a"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.needs$a",{dims: [4], eltype: rtl.longint});
      $r.addField("needs",$mod.$rtti["TEndgameInfo.needs$a"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.avail$a",{dims: [4], eltype: rtl.longint});
      $r.addField("avail",$mod.$rtti["TEndgameInfo.avail$a"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.card$a",{dims: [36], eltype: pas.DecOnMac.$rtti["DCard"]});
      $r.addField("card",$mod.$rtti["TEndgameInfo.card$a"]);
      $r.addField("numCards",rtl.longint);
      $r.addField("numPlayers",rtl.longint);
      $r.addField("hand",pas.DecOnMac.$rtti["DHands"]);
      $r.addField("consistent",rtl.boolean);
      $r.addField("round",pas.DecOnMac.$rtti["DRound"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.legal$a",{dims: [36], eltype: rtl.boolean});
      $r.addField("legal",$mod.$rtti["TEndgameInfo.legal$a"]);
      $mod.$rtti.$StaticArray("TEndgameInfo.val$a",{dims: [36], eltype: rtl.double});
      $r.addField("val",$mod.$rtti["TEndgameInfo.val$a"]);
    });
    $mod.$rtti.$Pointer("TEndgameInfoP",{reftype: $mod.$rtti["TEndgameInfo"]});
    $impl.MoveValue = function (e, p, i) {
      var Result = 0.0;
      var num = 0;
      var intrick = 0;
      var nextp = 0;
      var j = 0;
      var sum = 0.0;
      var card = 0;
      var xcard = 0;
      var round = pas.DecOnMac.DRound.$new();
      var allLeg = false;
      var stop = false;
      var t_card = 0;
      var t_val = 0;
      var q = 0;
      round.fPoints[e.player] = e.round.fPoints[e.player];
      round.fTrickColor = e.round.fTrickColor;
      round.fTrickCard = e.round.fTrickCard;
      round.fTrickOwner = e.round.fTrickOwner;
      round.fTrickValue = e.round.fTrickValue;
      card = e.hand[p].fCard[i];
      e.hand[p].fNum = e.hand[p].fNum - 1;
      e.hand[p].fCard[i] = e.hand[p].fCard[e.hand[p].fNum];
      intrick = e.round.fInTrick;
      e.round.fNumPlayed = e.round.fNumPlayed + 1;
      e.round.fInTrick = e.fGlobal.fRules.fNextPlayer[e.round.fInTrick];
      if (intrick === 0) {
        e.round.fTrickColor = pas.DecOnMac.pColorOf[card];
        e.round.fTrickCard = card;
        e.round.fTrickOwner = p;
        e.round.fTrickValue = pas.DecOnMac.pValueOfCard[card];
      } else {
        if (pas.DecOnMac.PBetterCard(card,e.round.fTrickCard)) {
          e.round.fTrickCard = card;
          e.round.fTrickOwner = p;
        };
        e.round.fTrickValue = e.round.fTrickValue + pas.DecOnMac.pValueOfCard[card];
        if (intrick === (e.numPlayers - 1)) {
          if (e.round.fTrickOwner === e.player) e.round.fPoints[e.player] = e.round.fPoints[e.player] + e.round.fTrickValue;
        };
      };
      if (e.round.fInTrick === 0) {
        nextp = e.round.fTrickOwner;
      } else nextp = e.fGlobal.fRules.fNextPlayer[p];
      if ((e.round.fNumPlayed + e.numPlayers) === 36) {
        t_card = e.hand[e.player].fCard[0];
        if ((e.player === nextp) || pas.DecOnMac.PBetterCard(t_card,e.hand[nextp].fCard[0])) {
          t_val = 5 + pas.DecOnMac.pValueOfCard[t_card];
          stop = false;
          q = e.numPlayers - 1;
          while ((q >= 0) && !stop) {
            if (q !== e.player) {
              xcard = e.hand[q].fCard[0];
              if (pas.DecOnMac.PBetterCard(xcard,t_card)) {
                t_val = 0;
                stop = true;
              } else t_val = t_val + pas.DecOnMac.pValueOfCard[xcard];
            };
            q = q - 1;
          };
        } else t_val = 0;
        sum = Math.abs((e.round.fPoints[e.player] + t_val) - e.fLocal.fCall[e.player]);
      } else {
        sum = 0;
        allLeg = pas.DecOnMac.AllLegal(e.hand[nextp],e.round.fNumPlayed,e.numPlayers,e.round.fTrickColor);
        if (allLeg) {
          for (var $l = e.hand[nextp].fNum - 1; $l >= 0; $l--) {
            j = $l;
            sum = sum + $impl.MoveValue(e,nextp,j);
          };
          sum = sum / e.hand[nextp].fNum;
        } else {
          num = 0;
          for (var $l1 = e.hand[nextp].fNum - 1; $l1 >= 0; $l1--) {
            j = $l1;
            xcard = e.hand[nextp].fCard[j];
            if (pas.DecOnMac.AllowedCard(xcard,e.round.fTrickCard,e.round.fTrickColor)) {
              sum = sum + $impl.MoveValue(e,nextp,j);
              num = num + 1;
            };
          };
          sum = sum / num;
        };
      };
      e.round.fPoints[e.round.fTrickOwner] = round.fPoints[e.round.fTrickOwner];
      e.round.fNumPlayed = e.round.fNumPlayed - 1;
      e.round.fInTrick = intrick;
      e.round.fTrickColor = round.fTrickColor;
      e.round.fTrickCard = round.fTrickCard;
      e.round.fTrickOwner = round.fTrickOwner;
      e.round.fTrickValue = round.fTrickValue;
      e.hand[p].fNum = e.hand[p].fNum + 1;
      e.hand[p].fCard[i] = card;
      Result = sum;
      return Result;
    };
    $impl.IncludePlayer = function (p, e, below) {
      var i = 0;
      var q = 0;
      var card = 0;
      var m = 0;
      if (e.hand[p].fNum === e.needs[p]) {
        p = e.nextPlayer[p];
        if (p === e.player) {
          e.consistent = true;
          for (var $l = e.hand[e.player].fNum - 1; $l >= 0; $l--) {
            i = $l;
            if (e.legal[i]) e.val[i] = e.val[i] + $impl.MoveValue(e,e.player,i);
          };
        } else $impl.IncludePlayer(p,e,e.numCards);
      } else {
        for (var $l1 = below - 1; $l1 >= 0; $l1--) {
          i = $l1;
          card = e.card[i];
          m = e.mayhave[card];
          if ((m & pas.DecOnMac.pBit[p]) > 0) {
            e.mayhave[card] = 0;
            e.hand[p].fCard[e.hand[p].fNum] = card;
            e.hand[p].fNum = e.hand[p].fNum + 1;
            $impl.IncludePlayer(p,e,i);
            e.hand[p].fNum = e.hand[p].fNum - 1;
            e.mayhave[card] = m;
          };
        };
      };
    };
  };
},[]);
rtl.module("Hjasser",["System","DecOnMac","Dialogs"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.h_create = function () {
    var Result = null;
    var self = null;
    self = $impl.THacker.$new();
    self.fCalled = false;
    self.fLevel = 99;
    Result = self;
    return Result;
  };
  this.h_destroy = function (s) {
    var self = null;
    self = s;
    self = null;
  };
  this.h_not_deal = function (global, local) {
    var self = null;
    var col = 0;
    var i = 0;
    var card = 0;
    var rank = 0;
    $impl.gTestDen = $impl.gTestDen + 1;
    self = local.fPrivate;
    self.fCalled = false;
    self.fLevel = global.fLevel[local.fPlayer];
    for (var $l = 3; $l >= 1; $l--) {
      col = $l;
      self.fCode[col] = 512 + 1024;
    };
    self.fCode[0] = 512;
    for (var $l1 = 3; $l1 >= 1; $l1--) {
      col = $l1;
      self.fLCode[col] = (2 * 19683) - 1;
    };
    self.fLCode[0] = 19683 - 1;
    for (var $l2 = local.fHand.fNum - 1; $l2 >= 0; $l2--) {
      i = $l2;
      card = local.fHand.fCard[i];
      col = pas.DecOnMac.pColorOf[card];
      rank = pas.DecOnMac.pRankOf[card];
      self.fCode[col] = self.fCode[col] + pas.DecOnMac.pBit[rank];
      self.fLCode[col] = self.fLCode[col] - pas.DecOnMac.pThree[rank];
    };
    self.fRemainingPoints = 157;
    self.fExpTrickPoints = rtl.trunc(157 / rtl.trunc(36 / global.fRules.fNumPlayers));
    self.fHistory[1].misere = false;
    self.fCallNots = 0;
  };
  this.h_not_count = function (global, local) {
    function Adjust(x, delta) {
      if (delta < 0) {
        if (x.get() > -delta) {
          x.set(x.get() + delta)}
         else x.set(0);
      } else if (x.get() < (2000000000 - delta)) x.set(x.get() + delta);
    };
    function AdjustMean(mean, learn) {
      mean.set(mean.get() + learn);
    };
    function AdjustMeanTo(mean, New) {
      mean.set(mean.get() + rtl.trunc((New - mean.get()) / 400));
    };
    var self = null;
    function AdjustCall() {
      var delta = 0;
      var col = 0;
      var vari = 0;
      vari = self.fVariant;
      if (self.fCall < global.fRound.fPoints[local.fPlayer]) {
        delta = 30}
       else if (self.fCall > global.fRound.fPoints[local.fPlayer]) {
        delta = -30}
       else delta = 0;
      Adjust({a: self.fIndex[0], p: $impl.gCallStat.valT[rtl.trunc(vari / 2)], get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }},delta);
      for (col = 1; col <= 3; col++) Adjust({a: self.fIndex[col], p: $impl.gCallStat.Call[vari].valNT, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }},delta);
      if (self.fCall1 < global.fRound.fPoints[local.fPlayer]) {
        Adjust({a: self.fCall, p: $impl.gCallStat.Call[vari].nonlinear, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }},30)}
       else Adjust({a: self.fCall, p: $impl.gCallStat.Call[vari].nonlinear, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }},-30);
    };
    function AdjustExpTri() {
      var col = 0;
      var trick = 0;
      var code = 0;
      var colTricks = rtl.arraySetLength(null,0,4);
      var colVal = rtl.arraySetLength(null,0,4);
      for (col = 0; col <= 3; col++) {
        colTricks[col] = 0;
        colVal[col] = 0;
      };
      for (var $l = 9; $l >= 1; $l--) {
        trick = $l;
        var $with = self.fHistory[trick];
        if (trick <= 7) {
          for (col = 0; col <= 3; col++) {
            code = $with.fCode[col];
            AdjustMeanTo({a: code, p: $impl.gCallStat.expTri, get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},colTricks[col] * 1000000);
            if ($with.misere) AdjustMeanTo({a: code, p: $impl.gCallStat.expTriM, get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},colTricks[col] * 1000000);
            if (trick <= 4) {
              AdjustMeanTo({a: $with.fLCode[col], p: $impl.gCallStat.expVal[0], get: function () {
                  return this.p[this.a];
                }, set: function (v) {
                  this.p[this.a] = v;
                }},colVal[col] * 1000000)}
             else AdjustMeanTo({a: $with.fLCode[col], p: $impl.gCallStat.expVal[1], get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},colVal[col] * 1000000);
          };
        };
        if ($with.fPlayer === local.fPlayer) {
          colTricks[$with.fColor] = colTricks[$with.fColor] + 1;
          colVal[$with.fColor] = colVal[$with.fColor] + $with.fValue;
        };
      };
    };
    self = local.fPrivate;
    if (!false && (self.fLevel === 99) && (global.fRound.fNumPlayed === 36)) {
      if (self.fCalled) AdjustCall();
      if (global.fRules.fNumPlayers === 4) AdjustExpTri();
    };
  };
  this.h_req_call = function (global, local) {
    var Result = 0;
    var i = 0;
    var vari = 0;
    var emptycol = 0;
    var callsum = 0;
    var Call = 0;
    var call1 = 0;
    var exptriM = 0;
    var card = 0;
    var col = 0;
    var rank = 0;
    var self = null;
    self = local.fPrivate;
    self.fCalled = true;
    for (var $l = 3; $l >= 0; $l--) {
      col = $l;
      self.fIndex[col] = 0;
    };
    for (var $l1 = local.fLegal.fNum - 1; $l1 >= 0; $l1--) {
      i = $l1;
      card = local.fLegal.fCard[i];
      col = pas.DecOnMac.pColorOf[card];
      rank = pas.DecOnMac.pRankOf[card];
      if (rank >= 3) {
        self.fIndex[col] = self.fIndex[col] + pas.DecOnMac.pBit[rank - 1]}
       else self.fIndex[col] = self.fIndex[col] + 1;
    };
    if (global.fRules.fNumPlayers === 4) {
      vari = 0;
      emptycol = 0;
      for (var $l2 = 3; $l2 >= 0; $l2--) {
        col = $l2;
        if (self.fIndex[col] === 0) emptycol = emptycol + 1;
      };
      if (emptycol !== 0) vari = 1;
    } else vari = 2;
    self.fVariant = vari;
    Call = $impl.gCallStat.valT[rtl.trunc(vari / 2)][self.fIndex[0]];
    for (var $l3 = 3; $l3 >= 1; $l3--) {
      col = $l3;
      Call = Call + $impl.gCallStat.Call[vari].valNT[self.fIndex[col]];
    };
    self.fCall = rtl.trunc((Call + rtl.trunc(10000 / 2)) / 10000);
    if (self.fCall > 157) self.fCall = 157;
    call1 = rtl.trunc(($impl.gCallStat.Call[vari].nonlinear[self.fCall] + rtl.trunc(10000 / 2)) / 10000);
    self.fCall1 = call1;
    if ((self.fIndex[0] >= 128) && (call1 < 32)) call1 = 32;
    if ((self.fIndex[0] >= 64) && (call1 < 28)) call1 = 28;
    if ((self.fIndex[0] >= 32) && (call1 < 25)) call1 = 25;
    exptriM = 0;
    for (var $l4 = 3; $l4 >= 0; $l4--) {
      col = $l4;
      exptriM = exptriM + $impl.gCallStat.expTriM[self.fCode[col]];
    };
    if (exptriM < rtl.trunc(1000000 / 2)) {
      self.fCalled = false;
      call1 = 0;
    };
    if (global.fRules.fSCallBonus && (self.fCallNots === (global.fRules.fNumPlayers - 1))) {
      callsum = 0;
      for (var $l5 = global.fRules.fNumPlayers - 1; $l5 >= 0; $l5--) {
        i = $l5;
        if (local.fCall[i] >= 0) callsum = callsum + local.fCall[i];
      };
      if (call1 > 0) {
        self.fCalled = false;
        if ((callsum + call1) > 157) {
          call1 = call1 + 4;
          call1 = ((rtl.trunc(((callsum + call1) - 2) / 5) * 5) + 2) - callsum;
          if (call1 > 157) call1 = 157;
        } else {
          call1 = call1 - 6;
          call1 = ((rtl.trunc(((callsum + call1) - 2) / 5) * 5) + 2) - callsum;
          if ((callsum + call1) >= 147) call1 = call1 - 5;
          if (call1 < 0) call1 = 0;
        };
      } else {
        if ((callsum > 157) && ((callsum % 5) === 1)) {
          self.fCalled = false;
          call1 = 1;
        };
      };
    };
    if (!global.fRules.fOpenCalls && (call1 >= 1) && (call1 <= 5)) {
      call1 = 0;
    };
    Result = call1;
    return Result;
  };
  this.h_not_call = function (global, local, player) {
    var self = null;
    self = local.fPrivate;
    if ((player === local.fPlayer) && (local.fCall[player] <= 1)) self.fHistory[1].misere = true;
    self.fCallNots = self.fCallNots + 1;
    if ((self.fLevel !== 99) && (player === local.fPlayer)) {
      local.fCall[player] = local.fCall[player] + rtl.trunc((99 - self.fLevel) / 10);
      if (local.fCall[player] < 0) local.fCall[player] = 0;
    };
  };
  this.h_req_card = function (global, local) {
    var Result = 0;
    var r = 0;
    var mine = 0;
    var i = 0;
    var legalset = rtl.arraySetLength(null,false,36);
    var card = 0;
    var c = 0;
    var self = null;
    var count = 0;
    self = local.fPrivate;
    mine = pas.DecOnMac.pBit[local.fPlayer];
    for (var $l = 35; $l >= 0; $l--) {
      c = $l;
      legalset[c] = false;
    };
    for (var $l1 = local.fLegal.fNum - 1; $l1 >= 0; $l1--) {
      i = $l1;
      legalset[local.fLegal.fCard[i]] = true;
    };
    $impl.gReason = "Unknown";
    if (global.fRound.fNumPlayed >= 25) {
      Result = pas.Hend.h_endgame(global,local);
      return Result;
    };
    self.fValueOfCardSP = pas.DecOnMac.pValueOfCard.slice(0);
    self.fPointsNeeded = local.fCall[local.fPlayer] - global.fRound.fPoints[local.fPlayer];
    self.fPointsNeededSP = self.fPointsNeeded;
    for (var $l2 = 35; $l2 >= 0; $l2--) {
      i = $l2;
      self.fTrickExpectedSP[i] = false;
    };
    count = 0;
    r = 9 - 1;
    while (r >= 0) {
      if ((local.fMayHave[r] === mine) && ((global.fRound.fInTrick === 0) || pas.DecOnMac.PBetterCard(r,global.fRound.fTrickCard))) {
        self.fPointsNeededSP = self.fPointsNeededSP - pas.DecOnMac.pValueOfCard[r];
        self.fValueOfCardSP[r] = 0;
        self.fTrickExpectedSP[r] = true;
        count = count + 1;
      } else if (local.fMayHave[r] !== 0) {
        r = 0;
      };
      r = r - 1;
    };
    self.fExpTrickPoints = 10;
    self.fPointsExpectedSP = count * self.fExpTrickPoints;
    if (global.fRound.fInTrick === 0) {
      card = $impl.req_card_first(global,local,{get: function () {
          return legalset;
        }, set: function (v) {
          legalset = v;
        }});
    } else {
      card = $impl.req_card_notfirst(global,local,{get: function () {
          return legalset;
        }, set: function (v) {
          legalset = v;
        }});
    };
    Result = card;
    return Result;
  };
  this.h_not_card = function (global, local, player, card) {
    var self = null;
    var trick = 0;
    var bitrank = 0;
    var col = 0;
    self = local.fPrivate;
    col = pas.DecOnMac.pColorOf[card];
    $impl.CompNewCode(card,local,{a: col, p: self.fCode, get: function () {
        return this.p[this.a];
      }, set: function (v) {
        this.p[this.a] = v;
      }},self.fCode[col],{get: function () {
        return bitrank;
      }, set: function (v) {
        bitrank = v;
      }});
    if (player === local.fPlayer) {
      self.fLCode[col] = self.fLCode[col] - pas.DecOnMac.pThree[pas.DecOnMac.pRankOf[card]]}
     else self.fLCode[col] = self.fLCode[col] - (2 * pas.DecOnMac.pThree[pas.DecOnMac.pRankOf[card]]);
    if (global.fRound.fInTrick === 0) {
      trick = rtl.trunc(global.fRound.fNumPlayed / global.fRules.fNumPlayers);
      var $with = self.fHistory[trick];
      $with.fPlayer = global.fRound.fTrickOwner;
      $with.fColor = pas.DecOnMac.pColorOf[global.fRound.fTrickCard];
      $with.fValue = global.fRound.fTrickValue;
      $with.fCode = self.fCode;
      $with.fLCode = self.fLCode;
      if (trick < 9) self.fHistory[trick + 1].misere = local.fCall[local.fPlayer] <= (global.fRound.fPoints[local.fPlayer] + 1);
      if (global.fRound.fNumPlayed !== 36) self.fRemainingPoints = self.fRemainingPoints - global.fRound.fTrickValue;
    };
  };
  this.h_Init = function () {
    var g = 0;
    $impl.InitCodeClass();
    $impl.gSaveCall = false;
    $impl.gSavePlay = false;
    $impl.ReadCallStat($impl.gCallStat);
    if ($impl.gCallStat.version !== 655619) $impl.ConvertCallStat();
    $impl.gExpVal = $impl.gCallStat.expVal;
    $impl.InitDiscardDiff();
    if ($impl.gPlayStat.version !== 655620) $impl.ConvertPlayStat();
    $impl.gTestNum = 0;
    $impl.gTestDen = 0;
  };
  this.h_Free = function () {
    var g = 0;
  };
  $mod.$implcode = function () {
    $impl.kDeterministic = false;
    $impl.kEndgameply = 25;
    $impl.gEvolve = 0;
    $impl.kDelta = 30;
    $impl.kUp = 1;
    $impl.kDown = -1;
    $impl.kHigh = 1;
    $impl.kLow = -1;
    $impl.kPlayName = "hplay.dat";
    $impl.kCallName = "hcall.dat";
    $impl.kExpPointsTrick = 10;
    $impl.cfCovered = 1;
    $impl.cfDoubleCovered = 2;
    $impl.cfGiveAway = 4;
    $impl.cfSingleton = 8;
    $impl.kMaxLevel = 99;
    $impl.TCodeClass = {"0": "ccUnknown", ccUnknown: 0, "1": "ccAll", ccAll: 1, "2": "ccNobody", ccNobody: 2, "3": "ccNone", ccNone: 3, "4": "ccHighest", ccHighest: 4, "5": "ccLowest", ccLowest: 5, "6": "ccOuter", ccOuter: 6};
    $mod.$rtti.$Enum("TCodeClass",{minvalue: 0, maxvalue: 6, ordtype: 1, enumtype: $impl.TCodeClass});
    $mod.$rtti.$StaticArray("DCardSet",{dims: [36], eltype: rtl.boolean});
    $mod.$rtti.$StaticArray("TCodeArray",{dims: [4], eltype: rtl.longint});
    $mod.$rtti.$StaticArray("TClassArray",{dims: [4], eltype: $mod.$rtti["TCodeClass"]});
    rtl.recNewT($impl,"THistoryRec",function () {
      this.fPlayer = 0;
      this.fColor = 0;
      this.fValue = 0;
      this.misere = false;
      this.$new = function () {
        var r = Object.create(this);
        r.fCode = rtl.arraySetLength(null,0,4);
        r.fLCode = rtl.arraySetLength(null,0,4);
        return r;
      };
      this.$eq = function (b) {
        return (this.fPlayer === b.fPlayer) && (this.fColor === b.fColor) && (this.fValue === b.fValue) && rtl.arrayEq(this.fCode,b.fCode) && rtl.arrayEq(this.fLCode,b.fLCode) && (this.misere === b.misere);
      };
      this.$assign = function (s) {
        this.fPlayer = s.fPlayer;
        this.fColor = s.fColor;
        this.fValue = s.fValue;
        this.fCode = s.fCode.slice(0);
        this.fLCode = s.fLCode.slice(0);
        this.misere = s.misere;
        return this;
      };
      var $r = $mod.$rtti.$Record("THistoryRec",{},this);
      $r.addField("fPlayer",pas.DecOnMac.$rtti["DPlayer"]);
      $r.addField("fColor",pas.DecOnMac.$rtti["DColor"]);
      $r.addField("fValue",rtl.longint);
      $r.addField("fCode",$mod.$rtti["TCodeArray"]);
      $r.addField("fLCode",$mod.$rtti["TCodeArray"]);
      $r.addField("misere",rtl.boolean);
    });
    rtl.recNewT($impl,"THacker",function () {
      this.fLevel = 0;
      this.fCalled = false;
      this.fVariant = 0;
      this.fCall = 0;
      this.fCall1 = 0;
      this.fRemainingPoints = 0;
      this.fHistory$a$clone = function (a) {
        var b = [];
        b.length = 13;
        for (var c = 0; c < 13; c++) b[c] = $impl.THistoryRec.$clone(a[c]);
        return b;
      };
      this.fCallNots = 0;
      this.fPointsNeeded = 0;
      this.fPointsNeededSP = 0;
      this.fPointsExpectedSP = 0;
      this.fExpTrickPoints = 0;
      this.$new = function () {
        var r = Object.create(this);
        r.fIndex = rtl.arraySetLength(null,0,4);
        r.fCode = rtl.arraySetLength(null,0,4);
        r.fLCode = rtl.arraySetLength(null,0,4);
        r.fHistory = rtl.arraySetLength(null,$impl.THistoryRec,13);
        r.fValueOfCardSP = rtl.arraySetLength(null,0,36);
        r.fTrickExpectedSP = rtl.arraySetLength(null,false,36);
        return r;
      };
      this.$eq = function (b) {
        return (this.fLevel === b.fLevel) && (this.fCalled === b.fCalled) && (this.fVariant === b.fVariant) && rtl.arrayEq(this.fIndex,b.fIndex) && (this.fCall === b.fCall) && (this.fCall1 === b.fCall1) && rtl.arrayEq(this.fCode,b.fCode) && rtl.arrayEq(this.fLCode,b.fLCode) && (this.fRemainingPoints === b.fRemainingPoints) && rtl.arrayEq(this.fHistory,b.fHistory) && (this.fCallNots === b.fCallNots) && rtl.arrayEq(this.fValueOfCardSP,b.fValueOfCardSP) && (this.fPointsNeeded === b.fPointsNeeded) && (this.fPointsNeededSP === b.fPointsNeededSP) && (this.fPointsExpectedSP === b.fPointsExpectedSP) && (this.fExpTrickPoints === b.fExpTrickPoints) && rtl.arrayEq(this.fTrickExpectedSP,b.fTrickExpectedSP);
      };
      this.$assign = function (s) {
        this.fLevel = s.fLevel;
        this.fCalled = s.fCalled;
        this.fVariant = s.fVariant;
        this.fIndex = s.fIndex.slice(0);
        this.fCall = s.fCall;
        this.fCall1 = s.fCall1;
        this.fCode = s.fCode.slice(0);
        this.fLCode = s.fLCode.slice(0);
        this.fRemainingPoints = s.fRemainingPoints;
        this.fHistory = this.fHistory$a$clone(s.fHistory);
        this.fCallNots = s.fCallNots;
        this.fValueOfCardSP = s.fValueOfCardSP.slice(0);
        this.fPointsNeeded = s.fPointsNeeded;
        this.fPointsNeededSP = s.fPointsNeededSP;
        this.fPointsExpectedSP = s.fPointsExpectedSP;
        this.fExpTrickPoints = s.fExpTrickPoints;
        this.fTrickExpectedSP = s.fTrickExpectedSP.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("THacker",{},this);
      $r.addField("fLevel",rtl.longint);
      $r.addField("fCalled",rtl.boolean);
      $r.addField("fVariant",rtl.longint);
      $mod.$rtti.$StaticArray("THacker.fIndex$a",{dims: [4], eltype: rtl.longint});
      $r.addField("fIndex",$mod.$rtti["THacker.fIndex$a"]);
      $r.addField("fCall",rtl.longint);
      $r.addField("fCall1",rtl.longint);
      $r.addField("fCode",$mod.$rtti["TCodeArray"]);
      $r.addField("fLCode",$mod.$rtti["TCodeArray"]);
      $r.addField("fRemainingPoints",rtl.longint);
      $mod.$rtti.$StaticArray("THacker.fHistory$a",{dims: [13], eltype: $mod.$rtti["THistoryRec"]});
      $r.addField("fHistory",$mod.$rtti["THacker.fHistory$a"]);
      $r.addField("fCallNots",rtl.longint);
      $r.addField("fValueOfCardSP",pas.DecOnMac.$rtti["DValueOfCard"]);
      $r.addField("fPointsNeeded",rtl.longint);
      $r.addField("fPointsNeededSP",rtl.longint);
      $r.addField("fPointsExpectedSP",rtl.longint);
      $r.addField("fExpTrickPoints",rtl.longint);
      $r.addField("fTrickExpectedSP",$mod.$rtti["DCardSet"]);
    });
    $mod.$rtti.$Pointer("THackerP",{reftype: $mod.$rtti["THacker"]});
    $impl.kPlayVersion = (10 * 65536) + 256 + 4;
    $impl.kCallVersion = (10 * 65536) + 256 + 3;
    $impl.mCode = 1024;
    $impl.mTCode = 2048;
    $impl.mLCode = 19683;
    $impl.mLTCode = 2 * 19683;
    $impl.mVari = 3;
    $impl.kExpTriFactor = 1000000;
    $impl.kCallFactor = 10000;
    $impl.deltaFactor = 100000;
    $impl.TExpVal$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) b[c] = a[c].slice(0);
      return b;
    };
    $mod.$rtti.$StaticArray("TExpVal",{dims: [2,39366], eltype: rtl.longint});
    rtl.recNewT($impl,"TCallRec",function () {
      this.$new = function () {
        var r = Object.create(this);
        r.valNT = rtl.arraySetLength(null,0,256);
        r.nonlinear = rtl.arraySetLength(null,0,158);
        return r;
      };
      this.$eq = function (b) {
        return rtl.arrayEq(this.valNT,b.valNT) && rtl.arrayEq(this.nonlinear,b.nonlinear);
      };
      this.$assign = function (s) {
        this.valNT = s.valNT.slice(0);
        this.nonlinear = s.nonlinear.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("TCallRec",{},this);
      $mod.$rtti.$StaticArray("TCallRec.valNT$a",{dims: [256], eltype: rtl.longint});
      $r.addField("valNT",$mod.$rtti["TCallRec.valNT$a"]);
      $mod.$rtti.$StaticArray("TCallRec.nonlinear$a",{dims: [158], eltype: rtl.longint});
      $r.addField("nonlinear",$mod.$rtti["TCallRec.nonlinear$a"]);
    });
    rtl.recNewT($impl,"TCallStat",function () {
      this.version = 0;
      this.valT$a$clone = function (a) {
        var b = [];
        b.length = 2;
        for (var c = 0; c < 2; c++) b[c] = a[c].slice(0);
        return b;
      };
      this.call$a$clone = function (a) {
        var b = [];
        b.length = 3;
        for (var c = 0; c < 3; c++) b[c] = $impl.TCallRec.$clone(a[c]);
        return b;
      };
      this.$new = function () {
        var r = Object.create(this);
        r.valT = rtl.arraySetLength(null,0,2,256);
        r.expTri = rtl.arraySetLength(null,0,2048);
        r.expVal = rtl.arraySetLength(null,0,2,39366);
        r.Call = rtl.arraySetLength(null,$impl.TCallRec,3);
        r.expTriM = rtl.arraySetLength(null,0,2048);
        return r;
      };
      this.$eq = function (b) {
        return (this.version === b.version) && rtl.arrayEq(this.valT,b.valT) && rtl.arrayEq(this.expTri,b.expTri) && rtl.arrayEq(this.expVal,b.expVal) && rtl.arrayEq(this.Call,b.Call) && rtl.arrayEq(this.expTriM,b.expTriM);
      };
      this.$assign = function (s) {
        this.version = s.version;
        this.valT = this.valT$a$clone(s.valT);
        this.expTri = s.expTri.slice(0);
        this.expVal = $impl.TExpVal$clone(s.expVal);
        this.Call = this.call$a$clone(s.Call);
        this.expTriM = s.expTriM.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("TCallStat",{},this);
      $r.addField("version",rtl.longint);
      $mod.$rtti.$StaticArray("TCallStat.valT$a",{dims: [2,256], eltype: rtl.longint});
      $r.addField("valT",$mod.$rtti["TCallStat.valT$a"]);
      $mod.$rtti.$StaticArray("TCallStat.expTri$a",{dims: [2048], eltype: rtl.longint});
      $r.addField("expTri",$mod.$rtti["TCallStat.expTri$a"]);
      $r.addField("expVal",$mod.$rtti["TExpVal"]);
      $mod.$rtti.$StaticArray("TCallStat.call$a",{dims: [3], eltype: $mod.$rtti["TCallRec"]});
      $r.addField("Call",$mod.$rtti["TCallStat.call$a"]);
      $mod.$rtti.$StaticArray("TCallStat.expTriM$a",{dims: [2048], eltype: rtl.longint});
      $r.addField("expTriM",$mod.$rtti["TCallStat.expTriM$a"]);
    });
    $mod.$rtti.$StaticArray("TNCodeArray",{dims: [1024], eltype: rtl.word});
    $mod.$rtti.$StaticArray("TTCodeArray",{dims: [2048], eltype: rtl.word});
    $mod.$rtti.$StaticArray("TDynArray",{dims: [2048], eltype: rtl.byte});
    rtl.recNewT($impl,"TStartRec",function () {
      this.$new = function () {
        var r = Object.create(this);
        r.perm = rtl.arraySetLength(null,0,2048);
        r.dyn = rtl.arraySetLength(null,0,2048);
        return r;
      };
      this.$eq = function (b) {
        return rtl.arrayEq(this.perm,b.perm) && rtl.arrayEq(this.dyn,b.dyn);
      };
      this.$assign = function (s) {
        this.perm = s.perm.slice(0);
        this.dyn = s.dyn.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("TStartRec",{},this);
      $r.addField("perm",$mod.$rtti["TTCodeArray"]);
      $r.addField("dyn",$mod.$rtti["TDynArray"]);
    });
    rtl.recNewT($impl,"TPlayStat",function () {
      this.version = 0;
      this.startnormal$a$clone = function (a) {
        var b = [];
        b.length = 2;
        for (var c = 0; c < 2; c++) b[c] = $impl.TStartRec.$clone(a[c]);
        return b;
      };
      this.$new = function () {
        var r = Object.create(this);
        r.startnormal = rtl.arraySetLength(null,$impl.TStartRec,2);
        r.startmisere = $impl.TStartRec.$new();
        r.rejectmisere = rtl.arraySetLength(null,0,1024);
        return r;
      };
      this.$eq = function (b) {
        return (this.version === b.version) && rtl.arrayEq(this.startnormal,b.startnormal) && this.startmisere.$eq(b.startmisere) && rtl.arrayEq(this.rejectmisere,b.rejectmisere);
      };
      this.$assign = function (s) {
        this.version = s.version;
        this.startnormal = this.startnormal$a$clone(s.startnormal);
        this.startmisere.$assign(s.startmisere);
        this.rejectmisere = s.rejectmisere.slice(0);
        return this;
      };
      var $r = $mod.$rtti.$Record("TPlayStat",{},this);
      $r.addField("version",rtl.longint);
      $mod.$rtti.$StaticArray("TPlayStat.startnormal$a",{dims: [2], eltype: $mod.$rtti["TStartRec"]});
      $r.addField("startnormal",$mod.$rtti["TPlayStat.startnormal$a"]);
      $r.addField("startmisere",$mod.$rtti["TStartRec"]);
      $r.addField("rejectmisere",$mod.$rtti["TNCodeArray"]);
    });
    $impl.gCallStat = $impl.TCallStat.$new();
    $impl.gSaveCall = false;
    $impl.gSavePlay = false;
    $mod.$rtti.$StaticArray("gCodeClass$a",{dims: [2048], eltype: $mod.$rtti["TCodeClass"]});
    $impl.gCodeClass = rtl.arraySetLength(null,0,2048);
    $mod.$rtti.$StaticArray("gCodeTricks$a",{dims: [1024], eltype: rtl.longint});
    $impl.gCodeTricks = rtl.arraySetLength(null,0,1024);
    $mod.$rtti.$StaticArray("gCodeFlags$a",{dims: [1024], eltype: rtl.word});
    $impl.gCodeFlags = rtl.arraySetLength(null,0,1024);
    $impl.gExpVal = rtl.arraySetLength(null,0,2,39366);
    $mod.$rtti.$StaticArray("gDiscardDiff$a",{dims: [2048], eltype: rtl.longint});
    $impl.gDiscardDiff = rtl.arraySetLength(null,0,2048);
    $impl.gTestNum = 0;
    $impl.gTestDen = 0;
    $impl.gReason = "";
    $impl.gPlayStat = $impl.TPlayStat.$new();
    $impl.BitAnd = function (a, b) {
      var Result = 0;
      Result = a & b;
      return Result;
    };
    $impl.BitOr = function (a, b) {
      var Result = 0;
      Result = a | b;
      return Result;
    };
    $impl.Optimize = function (card, legalset, mayhave, mine, up, high) {
      var curval = 0;
      var c = 0;
      var last = 0;
      curval = pas.DecOnMac.pValueOfCard[card.get()];
      if (up === 1) {
        last = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[card.get()],8)}
       else last = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[card.get()],0);
      c = card.get();
      while (c !== last) {
        if ((mayhave.get()[c] !== 0) && (mayhave.get()[c] !== mine)) return;
        if (legalset.get()[c] && ((pas.DecOnMac.pValueOfCard[c] * high) > (curval * high))) {
          curval = pas.DecOnMac.pValueOfCard[c];
          card.set(c);
        };
        c = c + up;
      };
    };
    $impl.CompNewCode = function (card, local, newcode, oldcode, bitrank) {
      var col = 0;
      var rank = 0;
      var bit = 0;
      var i = 0;
      col = pas.DecOnMac.pColorOf[card];
      rank = pas.DecOnMac.pRankOf[card];
      bit = 1;
      bitrank.set(0);
      for (var $l = 0, $end = rank - 1; $l <= $end; $l++) {
        i = $l;
        if (local.fMayHave[pas.DecOnMac.CardOf(col,i)] !== 0) {
          bit = bit * 2;
          bitrank.set(bitrank.get() + 1);
        };
      };
      if (col !== 0) oldcode = oldcode - 1024;
      newcode.set((oldcode % bit) + (rtl.trunc(oldcode / (bit * 2)) * bit));
      if (col !== 0) newcode.set(newcode.get() + 1024);
    };
    $impl.rest_first = function (global, local, legalset) {
      var Result = 0;
      var col = 0;
      var card = 0;
      var code = 0;
      var mine = 0;
      var r = 0;
      var cantri = 0;
      var self = null;
      var ok = false;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      if (($impl.gCodeTricks[self.fCode[0]] >= 1) && (self.fCode[0] !== 3)) {
        for (var $l = 8; $l >= 0; $l--) {
          r = $l;
          if (local.fMayHave[r] === mine) {
            Result = r;
            return Result;
          };
        };
      };
      cantri = 0;
      for (col = 0; col <= 3; col++) cantri = cantri + $impl.gCodeTricks[self.fCode[col] % 1024];
      if (((cantri * 4) + global.fRound.fNumPlayed) === 36) {
        for (var $l1 = 8; $l1 >= 0; $l1--) {
          r = $l1;
          if (local.fMayHave[r] === mine) {
            Result = r;
            return Result;
          };
        };
      };
      for (col = 1; col <= 3; col++) {
        code = self.fCode[col] % 1024;
        if ($impl.BitAnd(code,code + 1) === 0) {
          for (r = 0; r <= 8; r++) if (local.fMayHave[pas.DecOnMac.CardOf(col,r)] === mine) {
            Result = pas.DecOnMac.CardOf(col,r);
            return Result;
          };
        };
      };
      for (col = 1; col <= 3; col++) {
        code = self.fCode[col] % 1024;
        if (($impl.BitAnd(code,(-2 * code) - 1) * 2) < code) {
          for (var $l2 = 8; $l2 >= 0; $l2--) {
            r = $l2;
            if (local.fMayHave[pas.DecOnMac.CardOf(col,r)] === mine) {
              Result = pas.DecOnMac.CardOf(col,r);
              return Result;
            };
          };
        };
      };
      card = 0;
      while ((card < 8) && (local.fMayHave[card] !== mine)) card = card + 1;
      if (local.fMayHave[card] === mine) {
        Result = card;
        return Result;
      };
      card = 0;
      while ((card < 26) && (local.fMayHave[pas.DecOnMac.CardOf((card % 3) + 1,rtl.trunc(card / 3))] !== mine)) card = card + 1;
      if (local.fMayHave[pas.DecOnMac.CardOf((card % 3) + 1,rtl.trunc(card / 3))] !== mine) {
        card = 0;
        while (local.fMayHave[card] !== mine) card = card + 1;
      } else card = pas.DecOnMac.CardOf((card % 3) + 1,rtl.trunc(card / 3));
      $impl.Optimize({get: function () {
          return card;
        }, set: function (v) {
          card = v;
        }},legalset,{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},mine,1,-1);
      Result = card;
      return Result;
    };
    $impl.try_heur_misere_first = function (global, local, legalset, c, ok) {
      var col = 0;
      var col0 = 0;
      var self = null;
      var classA = rtl.arraySetLength(null,0,4);
      self = local.fPrivate;
      ok.set(false);
      if (self.fPointsNeeded > 1) return;
      for (var $l = 3; $l >= 0; $l--) {
        col = $l;
        classA[col] = $impl.gCodeClass[self.fCode[col]];
      };
      if ((classA[0] === $impl.TCodeClass.ccNobody) || (classA[0] === $impl.TCodeClass.ccNone)) {
        col0 = 0;
        ok.set(true);
        for (var $l1 = 3; $l1 >= 1; $l1--) {
          col = $l1;
          if ($impl.BitAnd($impl.gCodeFlags[self.fCode[col] - 1024],2) > 0) col0 = col;
          if ($impl.BitAnd($impl.gCodeFlags[self.fCode[col] - 1024],1) === 0) ok.set(false);
        };
        if (col0 !== 0) {
          c.set(pas.DecOnMac.CardOf(col0,0));
          while (!legalset.get()[c.get()]) c.set(c.get() + 1);
        } else ok.set(false);
      };
    };
    $impl.misere_first = function (global, local, legalset) {
      var Result = 0;
      var best = 0;
      var code = 0;
      var smallcode = 0;
      var mine = 0;
      var r = 0;
      var dynrank = 0;
      var val = 0;
      var bestcode = 0;
      var othersbelow = 0;
      var bestcol = 0;
      var col = 0;
      var self = null;
      var c = 0;
      var c2 = 0;
      var ok = false;
      var classA = 0;
      var bestclassA = 0;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      $impl.try_heur_misere_first(global,local,legalset,{get: function () {
          return c2;
        }, set: function (v) {
          c2 = v;
        }},{get: function () {
          return ok;
        }, set: function (v) {
          ok = v;
        }});
      if (ok) {
        Result = c2;
        return Result;
      };
      best = -10000;
      bestcol = 0;
      bestcode = -1;
      bestclassA = $impl.TCodeClass.ccUnknown;
      for (col = 0; col <= 3; col++) {
        code = self.fCode[col];
        smallcode = code % 1024;
        if ($impl.BitAnd(smallcode,smallcode - 1) !== 0) {
          classA = $impl.gCodeClass[smallcode];
          val = $impl.gPlayStat.startmisere.perm[code];
          if ($impl.BitAnd(smallcode,smallcode + 1) === 0) val = val - 2000;
          if (code === 768) val = val - 1500;
          if (code === 1792) val = val - 1500;
          if (val > best) {
            best = $impl.gPlayStat.startmisere.perm[code];
            bestcol = col;
            bestcode = code;
            bestclassA = classA;
          };
        };
      };
      dynrank = $impl.gPlayStat.startmisere.dyn[bestcode];
      r = -1;
      othersbelow = 0;
      while (dynrank >= 0) {
        r = r + 1;
        if (r === 9) pas.System.Writeln("Error in misere_first");
        if (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] === mine) {
          dynrank = dynrank - 1}
         else if (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] !== 0) othersbelow = othersbelow + 1;
      };
      c = pas.DecOnMac.CardOf(bestcol,r);
      if ((othersbelow === 0) && (bestclassA !== $impl.TCodeClass.ccAll)) {
        $impl.Optimize({get: function () {
            return c;
          }, set: function (v) {
            c = v;
          }},legalset,{p: local, get: function () {
            return this.p.fMayHave;
          }, set: function (v) {
            this.p.fMayHave = v;
          }},mine,-1,1);
        $impl.Optimize({get: function () {
            return c;
          }, set: function (v) {
            c = v;
          }},legalset,{p: local, get: function () {
            return this.p.fMayHave;
          }, set: function (v) {
            this.p.fMayHave = v;
          }},mine,1,1);
      } else $impl.Optimize({get: function () {
          return c;
        }, set: function (v) {
          c = v;
        }},legalset,{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},mine,1,-1);
      Result = c;
      return Result;
    };
    $impl.SaveJack = function (c, mayhave, mine) {
      var card = 0;
      if (c.get() === 8) {
        card = 8 - 1;
        while ((card > 0) && (mayhave.get()[card] === 0)) card = card - 1;
        if (mayhave.get()[card] === mine) c.set(card);
      };
    };
    $impl.table_first0 = function (global, local, sn) {
      var Result = 0;
      var bestcol = 0;
      var col = 0;
      var best = 0;
      var code = 0;
      var bestcode = 0;
      var r = 0;
      var dynrank = 0;
      var mine = 0;
      var val = 0;
      var c = 0;
      var self = null;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      best = -10000;
      bestcol = 0;
      bestcode = -1;
      for (col = 0; col <= 3; col++) {
        code = self.fCode[col] % 1024;
        if ($impl.BitAnd(code,code - 1) !== 0) {
          if (col !== 0) code = code + 1024;
          val = sn.perm[code];
          if ((col !== 0) && ($impl.gPlayStat.rejectmisere[code - 1024] < 330)) val = val - 100;
          if (col === 0) val = val - 5000;
          if (local.fMayHave[pas.DecOnMac.CardOf(col,8)] === mine) val = val - 2000;
          if (val > best) {
            bestcode = code;
            best = val;
            bestcol = col;
          };
        };
      };
      dynrank = sn.dyn[bestcode];
      r = 9;
      while (dynrank >= 0) {
        r = r - 1;
        if (r < 0) pas.System.Writeln("Error in table_first0");
        if (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] === mine) dynrank = dynrank - 1;
      };
      c = pas.DecOnMac.CardOf(bestcol,r);
      $impl.SaveJack({get: function () {
          return c;
        }, set: function (v) {
          c = v;
        }},{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},mine);
      Result = c;
      return Result;
    };
    $impl.high_first = function (global, local) {
      var Result = 0;
      var val = 0;
      var bestval = 0;
      var col = 0;
      var bestcol = 0;
      var dynrank = 0;
      var r = 0;
      var mine = 0;
      var bit = 0;
      var x = 0;
      var code = 0;
      var stopbit = 0;
      var c = 0;
      var self = null;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      bestval = -10 * 1000000;
      bestcol = 0;
      for (col = 1; col <= 3; col++) {
        code = self.fCode[col] - 1024;
        if (($impl.gCodeClass[code] !== $impl.TCodeClass.ccNone) && ($impl.gCodeClass[code] !== $impl.TCodeClass.ccNobody)) {
          bit = 1;
          while (bit < code) bit = bit * 2;
          bit = rtl.trunc(bit / 2);
          stopbit = bit;
          x = code - stopbit;
          bit = rtl.trunc(bit / 2);
          while (bit > x) bit = rtl.trunc(bit / 2);
          x = x - bit;
          stopbit = rtl.trunc(stopbit / 2);
          val = $impl.gCallStat.expTri[code + 1024];
          val = val + 1000000;
          if (local.fMayHave[pas.DecOnMac.CardOf(col,8)] === mine) val = val - 1000000;
          if (val > bestval) {
            bestval = val;
            bestcol = col;
          };
        };
      };
      r = 0;
      while ((r < 8) && (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] !== mine)) r = r + 1;
      if (r < 4) {
        r = 5;
        while ((r < 8) && (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] !== mine)) r = r + 1;
      } else r = 8;
      if (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] !== mine) {
        dynrank = 0;
        r = 9;
        while (dynrank >= 0) {
          r = r - 1;
          if (r < 0) {
            pas.System.Writeln("Error in high_first",bestcol,self.fCode[bestcol]);
          };
          if (local.fMayHave[pas.DecOnMac.CardOf(bestcol,r)] === mine) dynrank = dynrank - 1;
        };
      };
      c = pas.DecOnMac.CardOf(bestcol,r);
      $impl.SaveJack({get: function () {
          return c;
        }, set: function (v) {
          c = v;
        }},{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},mine);
      Result = c;
      return Result;
    };
    $impl.normal_first1 = function (global, local) {
      var Result = 0;
      var col = 0;
      var mine = 0;
      var i = 0;
      var bitrank = 0;
      var card = 0;
      var bestcard = 0;
      var self = null;
      var exptri0 = 0;
      var exptriM0 = 0;
      var bestresult = 0;
      var newcode = 0;
      var resultV = 0;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      exptri0 = 0;
      exptriM0 = 0;
      for (col = 0; col <= 3; col++) {
        exptri0 = exptri0 + $impl.gCallStat.expTri[self.fCode[col]];
        exptriM0 = exptriM0 + $impl.gCallStat.expTriM[self.fCode[col]];
      };
      bestresult = -2000000000;
      bestcard = 0;
      for (var $l = local.fHand.fNum - 1; $l >= 0; $l--) {
        i = $l;
        card = local.fHand.fCard[i];
        col = pas.DecOnMac.pColorOf[card];
        $impl.CompNewCode(card,local,{get: function () {
            return newcode;
          }, set: function (v) {
            newcode = v;
          }},self.fCode[col],{get: function () {
            return bitrank;
          }, set: function (v) {
            bitrank = v;
          }});
        resultV = (5 * $impl.gCallStat.expTriM[self.fCode[col]]) - $impl.gCallStat.expTriM[newcode];
        if (col === 0) {
          resultV = resultV - 100000000}
         else if (pas.DecOnMac.pRankOf[card] === 8) resultV = resultV - 50000000;
        if (resultV > bestresult) {
          bestresult = resultV;
          bestcard = card;
        };
      };
      $impl.SaveJack({get: function () {
          return bestcard;
        }, set: function (v) {
          bestcard = v;
        }},{p: local, get: function () {
          return this.p.fMayHave;
        }, set: function (v) {
          this.p.fMayHave = v;
        }},mine);
      Result = bestcard;
      return Result;
    };
    $impl.normal_first = function (global, local) {
      var Result = 0;
      var col = 0;
      var exptri0 = 0;
      var expNeeded = 0;
      var self = null;
      self = local.fPrivate;
      exptri0 = 0;
      for (col = 0; col <= 3; col++) exptri0 = exptri0 + $impl.gCallStat.expTri[self.fCode[col]];
      expNeeded = (self.fPointsNeededSP * 1000000) - (exptri0 * 13);
      var $with = $impl.gPlayStat;
      if (expNeeded < 0) {
        $impl.gReason = "table startnormal 1 (very low)";
        Result = $impl.table_first0(global,local,$with.startnormal[1]);
      } else if (expNeeded <= (8 * 1000000)) {
        $impl.gReason = "newstartnormal 1 (low)";
        Result = $impl.normal_first1(global,local);
      } else {
        $impl.gReason = "high first";
        Result = $impl.high_first(global,local);
      };
      return Result;
    };
    $impl.req_card_first = function (global, local, legalset) {
      var Result = 0;
      var mine = 0;
      var r = 0;
      var numTrumps = 0;
      var restpoints = 0;
      var self = null;
      var card = 0;
      var exptriM0 = 0;
      var col = 0;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      restpoints = self.fRemainingPoints;
      card = 8;
      while ((card > 0) && (local.fMayHave[card] !== mine)) {
        if (local.fMayHave[card] !== 0) restpoints = restpoints - pas.DecOnMac.pValueOfCard[card];
        card = card - 1;
      };
      if ((self.fPointsNeeded + 5) >= restpoints) {
        $impl.gReason = "rest first";
        Result = $impl.rest_first(global,local,legalset);
        return Result;
      };
      numTrumps = 0;
      for (var $l = 8; $l >= 0; $l--) {
        r = $l;
        if (local.fMayHave[r] !== 0) numTrumps = numTrumps + 1;
      };
      exptriM0 = 0;
      for (col = 1; col <= 3; col++) {
        exptriM0 = exptriM0 + $impl.gCallStat.expTriM[self.fCode[col]];
      };
      if ((exptriM0 < rtl.trunc(1000000 / 2)) && (numTrumps >= 7)) {
        if ((self.fPointsNeededSP - self.fPointsExpectedSP) <= 10) {
          for (var $l1 = 3; $l1 >= 1; $l1--) {
            r = $l1;
            if (local.fMayHave[r] === mine) {
              $impl.gReason = "<= 10 points needed; play low trump first";
              Result = r;
              return Result;
            };
          };
        };
      };
      if ((self.fPointsNeededSP - self.fPointsExpectedSP) <= 4) {
        $impl.gReason = "misere first";
        Result = $impl.misere_first(global,local,legalset);
        return Result;
      };
      if ((self.fPointsNeededSP - self.fPointsExpectedSP) > 10) {
        $impl.gReason = "normal first";
        card = $impl.normal_first(global,local);
        Result = card;
      } else {
        $impl.gReason = "table startnormal 0";
        var $with = $impl.gPlayStat;
        Result = $impl.table_first0(global,local,$with.startnormal[0]);
      };
      return Result;
    };
    var kCorr = 6 * 1000000;
    var kTriPt = 15;
    $impl.normal_notfirst = function (global, local, legalset) {
      var Result = 0;
      var exptri = 0;
      var exptri0 = 0;
      var expval = 0;
      var expval0 = 0;
      var col = 0;
      var col0 = 0;
      var newcode = 0;
      var newlcode = 0;
      var i = 0;
      var evi = 0;
      var self = null;
      var mine = 0;
      var card = 0;
      var bestcard = 0;
      var val = 0;
      var bestval = 0;
      var maxval = 0;
      var penalty = 0;
      var thistrick = 0;
      var ptneeded = 0;
      var ptneeded0 = 0;
      var classA = rtl.arraySetLength(null,0,4);
      var tri = rtl.arraySetLength(null,0,4);
      var mkrest = false;
      var mknull = false;
      var canrest = false;
      var flag = false;
      var bitrank = 0;
      function AllTrumpsMine(ptneeded) {
        var cantri = 0;
        var col0 = 0;
        cantri = 0;
        for (col0 = 1; col0 <= 3; col0++) cantri = cantri + tri[col0];
        cantri = cantri * 15 * 1000000;
        if (col === 0) {
          cantri = cantri + $impl.gExpVal[evi][newlcode]}
         else cantri = cantri + $impl.gExpVal[evi][self.fLCode[0]];
        if (expval < cantri) if (cantri < (ptneeded * 1000000)) {
          expval = cantri}
         else expval = ptneeded * 1000000;
        val = (Math.abs((ptneeded * 1000000) - expval) + (6 * exptri) + penalty) - 6000000;
      };
      self = local.fPrivate;
      $impl.gReason = "normal notfirst";
      mine = pas.DecOnMac.pBit[local.fPlayer];
      flag = false;
      if (flag) {
        pas.System.Writeln("xx: card nr ",global.fRound.fNumPlayed,"  needed ",self.fPointsNeeded," trumps ",self.fPointsNeeded - self.fPointsNeededSP,self.fPointsNeededSP - self.fPointsExpectedSP);
      };
      if (global.fRound.fNumPlayed < 16) {
        evi = 0}
       else evi = 1;
      exptri0 = 0;
      expval0 = 0;
      for (col = 0; col <= 3; col++) {
        exptri0 = exptri0 + $impl.gCallStat.expTri[self.fCode[col]];
        expval0 = expval0 + $impl.gExpVal[evi][self.fLCode[col]];
        classA[col] = $impl.gCodeClass[self.fCode[col]];
        tri[col] = $impl.gCodeTricks[self.fCode[col] % 1024];
      };
      if (flag) {
        pas.System.Writeln("Exp: tricks ",exptri0 / 1000000,", val ",expval0 / 1000000,", delta",self.fPointsNeeded - (expval0 / 1000000));
      };
      ptneeded0 = self.fPointsNeeded;
      maxval = Math.abs(ptneeded0 - self.fRemainingPoints);
      if (Math.abs(ptneeded0) > maxval) maxval = Math.abs(ptneeded0);
      maxval = maxval * 1000000;
      bestval = 2000000000;
      bestcard = 0;
      for (var $l = local.fLegal.fNum - 1; $l >= 0; $l--) {
        i = $l;
        card = local.fLegal.fCard[i];
        col = pas.DecOnMac.pColorOf[card];
        $impl.CompNewCode(card,local,{get: function () {
            return newcode;
          }, set: function (v) {
            newcode = v;
          }},self.fCode[col],{get: function () {
            return bitrank;
          }, set: function (v) {
            bitrank = v;
          }});
        classA[col] = $impl.gCodeClass[newcode];
        tri[col] = $impl.gCodeTricks[newcode % 1024];
        newlcode = self.fLCode[col] - pas.DecOnMac.pThree[pas.DecOnMac.pRankOf[card]];
        penalty = 0;
        if (!pas.System.Odd(newcode) && pas.System.Odd(self.fCode[col])) penalty = 5 * 1000000;
        exptri = (exptri0 - $impl.gCallStat.expTri[self.fCode[col]]) + $impl.gCallStat.expTri[newcode];
        expval = (expval0 - $impl.gExpVal[evi][self.fLCode[col]]) + $impl.gExpVal[evi][newlcode];
        mkrest = (classA[0] === $impl.TCodeClass.ccAll) || (classA[0] === $impl.TCodeClass.ccNobody);
        for (col0 = 1; col0 <= 3; col0++) if ((classA[col0] !== $impl.TCodeClass.ccAll) && (classA[col0] !== $impl.TCodeClass.ccNobody) && (classA[col0] !== $impl.TCodeClass.ccNone) && (classA[col0] !== $impl.TCodeClass.ccHighest)) mkrest = false;
        mknull = (classA[0] === $impl.TCodeClass.ccNone) || (classA[0] === $impl.TCodeClass.ccNobody);
        for (col0 = 1; col0 <= 3; col0++) if ((classA[col0] !== $impl.TCodeClass.ccAll) && (classA[col0] !== $impl.TCodeClass.ccNobody) && (classA[col0] !== $impl.TCodeClass.ccNone) && (classA[col0] !== $impl.TCodeClass.ccLowest)) mknull = false;
        if (!mknull) mknull = exptri < rtl.trunc((2 * 1000000) / 10);
        canrest = classA[0] === $impl.TCodeClass.ccAll;
        for (col0 = 1; col0 <= 3; col0++) if ((classA[col0] !== $impl.TCodeClass.ccAll) && (classA[col0] !== $impl.TCodeClass.ccNobody) && (classA[col0] !== $impl.TCodeClass.ccNone) && (classA[col0] !== $impl.TCodeClass.ccOuter)) canrest = false;
        val = 9999;
        if (pas.DecOnMac.PBetterCard(card,global.fRound.fTrickCard)) {
          ptneeded = ptneeded0 - global.fRound.fTrickValue - pas.DecOnMac.pValueOfCard[card];
          if (mkrest) {
            val = Math.abs(ptneeded0 - self.fRemainingPoints) * 1000000}
           else if (classA[0] === $impl.TCodeClass.ccAll) {
            AllTrumpsMine(ptneeded)}
           else val = (Math.abs((ptneeded * 1000000) - expval) + (6 * exptri) + penalty) - 6000000;
          if ((card === 7) && ($impl.BitOr(local.fMayHave[8],mine) > mine)) {
            if (global.fRound.fInTrick === 1) {
              val = val + (3 * 1000000)}
             else if (global.fRound.fInTrick === 3) val = val - (7 * 1000000);
          };
          if (!global.fRules.fOpenCalls && (card === 8) && (global.fRound.fTrickCard === 7)) {
            val = val + (50 * 1000000);
          };
          if (!global.fRules.fOpenCalls && (pas.DecOnMac.pRankOf[global.fRound.fTrickCard] === 8)) {
            val = val + (4 * 1000000);
          };
          if ((card === 8) && (exptri > (1 * 1000000)) && (global.fRound.fNumPlayed < 28)) {
            val = val + (rtl.trunc((28 - global.fRound.fNumPlayed) / 4) * 1000000);
          };
          if ((card === 8) && (exptri > (1 * 1000000)) && (global.fRound.fInTrick <= 2) && (global.fRound.fNumPlayed <= 12) && (local.fCall[local.fPlayer] <= 50)) {
            val = val + (5 * 1000000);
          };
          if (global.fRound.fInTrick === 1) val = val + (2 * 1000000);
          if (global.fRound.fInTrick === 3) val = val - (2 * 1000000);
          if ((global.fRound.fInTrick === 3) && (pas.DecOnMac.pRankOf[card] === 8) && !pas.DecOnMac.IsTrump(card)) {
            val = val - (2 * 1000000);
          };
        } else {
          ptneeded = ptneeded0;
          if (mknull) {
            val = Math.abs(ptneeded0) * 1000000}
           else if (canrest) {
            thistrick = global.fRound.fTrickValue + pas.DecOnMac.pValueOfCard[card];
            if (ptneeded0 > (self.fRemainingPoints - thistrick)) {
              val = (ptneeded0 - (self.fRemainingPoints - thistrick)) * 1000000}
             else if (ptneeded0 < expval) {
              val = expval - (ptneeded0 * 1000000)}
             else val = 5 * 1000000;
          } else if (classA[0] === $impl.TCodeClass.ccAll) {
            AllTrumpsMine(ptneeded0)}
           else val = (Math.abs((ptneeded0 * 1000000) - expval) + (5 * exptri) + penalty) - 6000000;
          if (pas.DecOnMac.pValueOfCard[card] >= 10) val = val - (5 * 1000000);
        };
        if (val > maxval) {
          val = (maxval - 100) + rtl.trunc((val - maxval) / 1000000);
        } else if (val < 0) val = 100 + rtl.trunc(val / 1000000);
        if (self.fLevel < 99) val = val + ((val % rtl.trunc(1000000 / 2)) * (99 - self.fLevel));
        if (val < bestval) {
          bestcard = card;
          bestval = val;
        };
        classA[col] = $impl.gCodeClass[self.fCode[col]];
        tri[col] = $impl.gCodeTricks[self.fCode[col] % 1024];
      };
      if (bestcard === 8) {
        card = 8 - 1;
        while ((card > 0) && (local.fMayHave[card] === 0)) card = card - 1;
        if (legalset.get()[card] && pas.DecOnMac.PBetterCard(card,global.fRound.fTrickCard)) bestcard = card;
      };
      Result = bestcard;
      return Result;
    };
    $impl.misere_notfirst = function (global, local, legalset) {
      var Result = 0;
      var self = null;
      var mine = 0;
      var exptri0 = 0;
      var ptneeded0 = 0;
      var expvalrnd = 0;
      var delta = 0;
      var thistrick = 0;
      var bestresult = 0;
      var resultV = 0;
      var risk = 0;
      var exptri = 0;
      var exptrichange = 0;
      var exptrirnd = 0;
      var exptriM0 = 0;
      var exptriM = 0;
      var exptriMchange = 0;
      var col = 0;
      var xcol = 0;
      var card = 0;
      var bestcard = 0;
      var i = 0;
      var bitrank = 0;
      var newcode = 0;
      var xcode = 0;
      var ok = false;
      function SmearRisk() {
        var Result = 0;
        var last = 0;
        var col = 0;
        var maysmear = false;
        last = pas.DecOnMac.pBit[global.fRules.fNextPlayer[local.fPlayer]];
        maysmear = false;
        col = 4 - 1;
        while (!maysmear && (col >= 0)) {
          maysmear = (($impl.BitAnd(local.fMayHave[pas.DecOnMac.CardOf(col,4)],last) !== 0) && !pas.DecOnMac.PBetterCard(pas.DecOnMac.CardOf(col,4),card)) || (($impl.BitAnd(local.fMayHave[pas.DecOnMac.CardOf(col,8)],last) !== 0) && !pas.DecOnMac.PBetterCard(pas.DecOnMac.CardOf(col,4),card));
          col = col - 1;
        };
        if (maysmear) {
          Result = 10 * 1000000}
         else Result = 6 * 1000000;
        return Result;
      };
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      $impl.gReason = "misere notfirst";
      exptri0 = 0;
      exptriM0 = 0;
      for (col = 0; col <= 3; col++) {
        exptri0 = exptri0 + $impl.gCallStat.expTri[self.fCode[col]];
        exptriM0 = exptriM0 + $impl.gCallStat.expTriM[self.fCode[col]];
      };
      ptneeded0 = self.fPointsNeededSP * 1000000;
      bestresult = 200 * 1000000;
      bestcard = 0;
      for (var $l = local.fLegal.fNum - 1; $l >= 0; $l--) {
        i = $l;
        card = local.fLegal.fCard[i];
        col = pas.DecOnMac.pColorOf[card];
        $impl.CompNewCode(card,local,{get: function () {
            return newcode;
          }, set: function (v) {
            newcode = v;
          }},self.fCode[col],{get: function () {
            return bitrank;
          }, set: function (v) {
            bitrank = v;
          }});
        exptrichange = $impl.gCallStat.expTri[self.fCode[col]] - $impl.gCallStat.expTri[newcode];
        exptri = exptri0 - exptrichange;
        exptriMchange = $impl.gCallStat.expTriM[self.fCode[col]] - $impl.gCallStat.expTriM[newcode];
        exptriM = exptriM0 - exptriMchange;
        exptrirnd = exptri;
        expvalrnd = exptrirnd * 10;
        risk = (exptri * 1) + (exptriM * 0);
        if (pas.DecOnMac.PBetterCard(card,global.fRound.fTrickCard)) {
          thistrick = (global.fRound.fTrickValue + self.fValueOfCardSP[card]) * 1000000;
          ok = false;
          for (xcol = 0; xcol <= 3; xcol++) {
            if (xcol !== col) {
              xcode = self.fCode[xcol] % 1024}
             else xcode = newcode % 1024;
            if ($impl.BitAnd($impl.gCodeFlags[xcode],4) !== 0) ok = true;
          };
          if (!ok) risk = risk + (50 * 1000000);
          var $tmp = global.fRules.fNumPlayers - global.fRound.fInTrick;
          if ($tmp === 1) {}
          else if ($tmp === 2) {
            risk = risk + SmearRisk();
            if (self.fTrickExpectedSP[card]) {
              risk = risk - (2 * 1000000)}
             else if ((col > 0) && (pas.DecOnMac.pValueOfCard[card] < 10)) {
              risk = risk - (1 * 1000000);
              thistrick = rtl.trunc((thistrick * 2) / 3);
            };
          } else if ($tmp === 3) {
            risk = risk + (30 * 1000000);
            if (self.fTrickExpectedSP[card]) {
              risk = risk - (8 * 1000000)}
             else if ((col > 0) && (pas.DecOnMac.pValueOfCard[card] < 10)) {
              risk = risk - (2 * 1000000);
              thistrick = rtl.trunc(thistrick / 2);
            };
          };
          delta = ptneeded0 - thistrick;
          if (card === 8) risk = risk + 1;
        } else {
          delta = ptneeded0;
          risk = risk - pas.DecOnMac.pValueOfCard[card];
        };
        delta = delta - expvalrnd;
        resultV = Math.abs(delta) + risk;
        if (self.fLevel < 99) resultV = resultV + ((resultV % rtl.trunc(1000000 / 2)) * (99 - self.fLevel));
        if (resultV < bestresult) {
          bestresult = resultV;
          bestcard = card;
        };
      };
      if (!pas.DecOnMac.PBetterCard(bestcard,global.fRound.fTrickCard)) {
        if (pas.DecOnMac.pColorOf[bestcard] === pas.DecOnMac.pColorOf[global.fRound.fTrickCard]) {
          bestcard = global.fRound.fTrickCard - 1}
         else bestcard = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[bestcard],8);
        while (local.fMayHave[bestcard] !== mine) bestcard = bestcard - 1;
        $impl.Optimize({get: function () {
            return bestcard;
          }, set: function (v) {
            bestcard = v;
          }},legalset,{p: local, get: function () {
            return this.p.fMayHave;
          }, set: function (v) {
            this.p.fMayHave = v;
          }},mine,-1,1);
      };
      Result = bestcard;
      return Result;
    };
    $impl.rest_notfirst = function (global, local, legalset) {
      var Result = 0;
      var i = 0;
      var bitrank = 0;
      var mine = 0;
      var card = 0;
      var max = 0;
      var bestcard = 0;
      var bestchange = 0;
      var exptrichange = 0;
      var newcode = 0;
      var col = 0;
      var self = null;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      $impl.gReason = "rest notfirst";
      if (global.fRound.fInTrick === 3) {
        card = global.fRound.fTrickCard;
        max = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[card],8);
        while ((card < max) && (local.fMayHave[card] !== mine)) card = card + 1;
        if (!pas.DecOnMac.IsTrump(card) && (local.fMayHave[card] !== mine) && (self.fCode[0] !== 6) && (self.fCode[0] !== 12)) {
          card = 0;
          while ((card < 8) && (local.fMayHave[card] !== mine)) card = card + 1;
        };
        if (local.fMayHave[card] === mine) {
          Result = card;
          return Result;
        };
      } else {
        max = global.fRound.fTrickCard;
        card = pas.DecOnMac.CardOf(pas.DecOnMac.pColorOf[max],8);
        while ((card > max) && (local.fMayHave[card] !== mine)) card = card - 1;
        if (!pas.DecOnMac.IsTrump(card) && (local.fMayHave[card] !== mine)) {
          card = 0;
          while ((card < 8) && (local.fMayHave[card] !== mine)) card = card + 1;
        };
        if (local.fMayHave[card] === mine) {
          Result = card;
          return Result;
        };
      };
      bestchange = 2000000000;
      bestcard = 0;
      for (var $l = local.fLegal.fNum - 1; $l >= 0; $l--) {
        i = $l;
        card = local.fLegal.fCard[i];
        col = pas.DecOnMac.pColorOf[card];
        $impl.CompNewCode(card,local,{get: function () {
            return newcode;
          }, set: function (v) {
            newcode = v;
          }},self.fCode[col],{get: function () {
            return bitrank;
          }, set: function (v) {
            bitrank = v;
          }});
        exptrichange = $impl.gCallStat.expTri[self.fCode[col]] - $impl.gCallStat.expTri[newcode];
        if (col === 0) exptrichange = exptrichange + 1000000000;
        if (exptrichange < bestchange) {
          bestchange = exptrichange;
          bestcard = pas.DecOnMac.CardOf(col,0);
          while (local.fMayHave[bestcard] !== mine) bestcard = bestcard + 1;
          $impl.Optimize({get: function () {
              return bestcard;
            }, set: function (v) {
              bestcard = v;
            }},legalset,{p: local, get: function () {
              return this.p.fMayHave;
            }, set: function (v) {
              this.p.fMayHave = v;
            }},mine,1,-1);
        };
      };
      Result = bestcard;
      return Result;
    };
    $impl.req_card_notfirst = function (global, local, legalset) {
      var Result = 0;
      var self = null;
      var restpoints = 0;
      var mine = 0;
      var card = 0;
      self = local.fPrivate;
      mine = pas.DecOnMac.pBit[local.fPlayer];
      restpoints = self.fRemainingPoints;
      card = 8;
      while ((card > 0) && (local.fMayHave[card] !== mine)) {
        if (local.fMayHave[card] !== 0) restpoints = restpoints - pas.DecOnMac.pValueOfCard[card];
        card = card - 1;
      };
      if ((self.fPointsNeeded >= Math.abs(self.fPointsNeeded - restpoints)) && (self.fPointsNeeded >= (restpoints - 5))) {
        Result = $impl.rest_notfirst(global,local,legalset)}
       else if ((local.fCall[local.fPlayer] <= 9) || ((self.fPointsNeededSP - self.fPointsExpectedSP) <= (6 - rtl.trunc((99 - self.fLevel) / 10)))) {
        Result = $impl.misere_notfirst(global,local,legalset)}
       else Result = $impl.normal_notfirst(global,local,legalset);
      return Result;
    };
    $impl.Alert = function (id, ptr) {
      var Result = 0;
      var $tmp = id;
      if ($tmp === 8001) {
        pas.Dialogs.ShowMessage("Converting call.dat...")}
       else if ($tmp === 8002) {
        pas.Dialogs.ShowMessage("Converting play.dat...")}
       else if ($tmp === 8003) {
        pas.Dialogs.ShowMessage("Error in call.dat...")}
       else if ($tmp === 8004) pas.Dialogs.ShowMessage("Error in play.dat...");
      Result = 0;
      return Result;
    };
    $impl.Convert16 = function (i) {
      i.set(((i.get() & 255) << 8) | ((i.get() >>> 8) & 255));
    };
    $impl.Convert32 = function (i) {
      i.set(((i.get() & 255) << 24) | ((i.get() & 65280) << 8) | ((i.get() >>> 8) & 65280) | ((i.get() >>> 24) & 255));
    };
    $impl.ConvertCallStat = function () {
      var i = 0;
      var j = 0;
      i = $impl.Alert(8001,null);
      $impl.Convert32({p: $impl.gCallStat, get: function () {
          return this.p.version;
        }, set: function (v) {
          this.p.version = v;
        }});
      if ($impl.gCallStat.version !== 655619) i = $impl.Alert(8003,null);
      for (i = 0; i <= 255; i++) $impl.Convert32({a: i, p: $impl.gCallStat.valT[0], get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (i = 0; i <= 255; i++) $impl.Convert32({a: i, p: $impl.gCallStat.valT[1], get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (i = 0; i <= 2047; i++) $impl.Convert32({a: i, p: $impl.gCallStat.expTri, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (i = 0; i <= 39365; i++) $impl.Convert32({a: i, p: $impl.gCallStat.expVal[0], get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (i = 0; i <= 39365; i++) $impl.Convert32({a: i, p: $impl.gCallStat.expVal[1], get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (j = 0; j <= 2; j++) {
        for (i = 0; i <= 255; i++) $impl.Convert32({a: i, p: $impl.gCallStat.Call[j].valNT, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
        for (i = 0; i <= 157; i++) $impl.Convert32({a: i, p: $impl.gCallStat.Call[j].nonlinear, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
      };
      for (i = 0; i <= 2047; i++) $impl.Convert32({a: i, p: $impl.gCallStat.expTriM, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
    };
    $impl.ConvertPlayStat = function () {
      var i = 0;
      var j = 0;
      i = $impl.Alert(8002,null);
      var $with = $impl.gPlayStat;
      $impl.Convert32({p: $with, get: function () {
          return this.p.version;
        }, set: function (v) {
          this.p.version = v;
        }});
      if ($impl.gPlayStat.version !== 655620) {
        i = $impl.Alert(8004,null)}
       else $impl.gSavePlay = true;
      for (i = 0; i <= 2047; i++) $impl.Convert16({a: i, p: $with.startmisere.perm, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (i = 0; i <= 1023; i++) $impl.Convert16({a: i, p: $with.rejectmisere, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
      for (j = 0; j <= 1; j++) for (i = 0; i <= 2047; i++) $impl.Convert16({a: i, p: $with.startnormal[j].perm, get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
    };
    $impl.ReadCallStat = function (gCallStat) {
    };
    $impl.WriteCallStat = function (gCallStat) {
      var f = 0;
    };
    $impl.InitCodeClass = function () {
      var i = 0;
      var j = 0;
      var k = 0;
      var ntotal = 0;
      var nlowest = 0;
      var nother = 0;
      var nhighest = 0;
      var nmine = 0;
      var nownbelow = 0;
      var myhighest = 0;
      var my2highest = 0;
      var mylowest = 0;
      var sure = false;
      var doublesure = false;
      for (i = 0; i <= 1023; i++) {
        $impl.gCodeClass[i] = $impl.TCodeClass.ccUnknown;
        $impl.gCodeTricks[i] = 0;
        $impl.gCodeFlags[i] = 0;
        j = i;
        k = j;
        ntotal = 0;
        nlowest = -1;
        nother = 0;
        nhighest = 0;
        nmine = 0;
        sure = true;
        doublesure = true;
        nownbelow = 0;
        mylowest = -1;
        myhighest = -1;
        my2highest = -1;
        while (k > 1) {
          ntotal = ntotal + 1;
          if (pas.System.Odd(k)) {
            if (mylowest === -1) mylowest = nmine + nother;
            my2highest = myhighest;
            myhighest = k;
            nmine = nmine + 1;
            nhighest = nhighest + 1;
            if (nownbelow < nother) sure = false;
            if ((nother > 0) && ((nownbelow - 1) < nother)) doublesure = false;
          } else {
            nother = nother + 1;
            if (nlowest === -1) nlowest = nhighest;
            nhighest = 0;
            nownbelow = nmine;
            if (nmine === 0) doublesure = false;
          };
          k = rtl.trunc(k / 2);
        };
        if (nother === 0) doublesure = false;
        if (nhighest < nother) {
          $impl.gCodeTricks[i] = nhighest}
         else $impl.gCodeTricks[i] = nmine;
        if (nmine === 0) {
          $impl.gCodeClass[i] = $impl.TCodeClass.ccNone}
         else if (nhighest === ntotal) {
          $impl.gCodeClass[i] = $impl.TCodeClass.ccAll}
         else if ((nother + nhighest) === ntotal) {
          $impl.gCodeClass[i] = $impl.TCodeClass.ccHighest}
         else if ((nother + nlowest) === ntotal) {
          $impl.gCodeClass[i] = $impl.TCodeClass.ccLowest}
         else if ((nhighest >= nother) && (nlowest >= nother)) $impl.gCodeClass[i] = $impl.TCodeClass.ccOuter;
        if (sure) $impl.gCodeFlags[i] = $impl.gCodeFlags[i] + 1;
        if (doublesure) $impl.gCodeFlags[i] = $impl.gCodeFlags[i] + 2;
        if (((mylowest === 0) && (nother > 0)) || ((mylowest === 1) && (nother >= 3)) || ((mylowest === 2) && (nother >= 5))) $impl.gCodeFlags[i] = $impl.gCodeFlags[i] + 4;
        if (nmine === 1) $impl.gCodeFlags[i] = $impl.gCodeFlags[i] + 8;
      };
      $impl.gCodeClass[1] = $impl.TCodeClass.ccNobody;
      $impl.gCodeTricks[1] = 0;
      $impl.gCodeFlags[1] = 1;
      for (i = 0; i <= 1023; i++) $impl.gCodeClass[i + 1024] = $impl.gCodeClass[i];
    };
    $impl.InitDiscardDiff = function () {
      var i = 0;
      var i0 = 0;
      var bit = 0;
      var newbit = 0;
      for (i = 1026; i <= 2047; i++) {
        $impl.gDiscardDiff[i] = $impl.gCallStat.expTri[i];
        i0 = i - 1024;
        bit = 1;
        while (bit <= i0) bit = bit * 2;
        bit = rtl.trunc(bit / 2);
        i0 = i0 - bit;
        newbit = rtl.trunc(bit / 2);
        if (i0 !== 0) {
          do {
            bit = rtl.trunc(bit / 2);
          } while (!($impl.BitAnd(i0,bit) !== 0));
          i0 = i0 - bit;
          i0 = i0 + newbit;
          $impl.gDiscardDiff[i] = $impl.gCallStat.expTri[i] - $impl.gCallStat.expTri[i0 + 1024];
          if ($impl.gDiscardDiff[i] < 0) $impl.gDiscardDiff[i] = 0;
        };
      };
    };
  };
},["DiffBase","Hend","PcFiles"]);
rtl.module("HackrJss",["System"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.InitHackerJasser = function () {
    var aHacker = null;
    $impl.gHJRnd = pas.DiffBase.NewRnd("Hacker");
    pas.Hjasser.h_Init();
    aHacker = $impl.THackerObj.$create("IJassHandler$2",[0]);
    pas.DiffPlay.DeclareHandler(aHacker,"Hacker 1");
    aHacker = $impl.THackerObj.$create("IJassHandler$2",[0]);
    pas.DiffPlay.DeclareHandler(aHacker,"Hacker 2");
  };
  this.FreeHackerJasser = function () {
    pas.Hjasser.h_Free();
  };
  $mod.$implcode = function () {
    $impl.kHackerRsrc = 8000;
    $impl.kHackerStrings = 8000;
    $impl.kHackerIcons = 7100;
    $impl.kSnaps = false;
    $impl.kAdvisorNum = 2;
    $impl.kUseAdvisor = false;
    $impl.gHJRnd = 0;
    $impl.gHJRes = 0;
    rtl.createClass($impl,"THackerObj",pas.Jassers.TProtoJasser,function () {
      this.$init = function () {
        pas.Jassers.TProtoJasser.$init.call(this);
        this.fMySnap = 0;
        this.trump = 0;
        this.global = pas.DecOnMac.TGlobal.$new();
        this.local = pas.DecOnMac.TLocal.$new();
        this.cardToLocal = rtl.arraySetLength(null,0,37);
        this.cardToGlobal = rtl.arraySetLength(null,0,36);
        this.fAdvisor = null;
      };
      this.$final = function () {
        this.global = undefined;
        this.local = undefined;
        this.cardToLocal = undefined;
        this.cardToGlobal = undefined;
        this.fAdvisor = undefined;
        pas.Jassers.TProtoJasser.$final.call(this);
      };
      this.IJassHandler$2 = function (player) {
        var saveRes = 0;
        var count = 0;
        var name = "";
        pas.Jassers.TProtoJasser.IJassHandler$1.call(this,player);
        name = "Snaps " + pas.SysUtils.IntToStr(player);
        this.fMySnap = 0;
        this.local.fPrivate = pas.Hjasser.h_create();
        this.fAdvisor = null;
        return this;
      };
      this.NewInstance = function (player) {
        var Result = null;
        var aHacker = null;
        aHacker = $impl.THackerObj.$create("IJassHandler$2",[player]);
        Result = aHacker;
        return Result;
      };
      this.About = function () {
      };
      this.HandleRequest = function (aReq, answer) {
        var playC = null;
        var i = 0;
        var c = 0;
        var t = 0;
        pas.DiffCmds.InitCommand(answer,0);
        var $tmp = aReq.fCmdID;
        if ($tmp === 2002) {
          pas.DiffCmds.InitCommand(answer,2002);
          answer.fCData.fPlayer = this.fPlayer;
          answer.fCData.fCall = pas.Hjasser.h_req_call(this.global,this.local);
        } else if ($tmp === 2003) {
          if ((this.global.fRound.fInTrick > 0) && (this.fAdvisor !== null)) {
            this.fAdvisor.HandleRequest(pas.DiffCmds.TCommand.$clone(aReq),answer);
            return;
          };
          playC = aReq.fCData;
          pas.DiffCmds.InitCommand(answer,2004);
          answer.fCData.fPlayer = this.fPlayer;
          this.HandToLocal(this.local.fHand,playC.fHand);
          this.HandToLocal(this.local.fLegal,playC.fLegal);
          if (this.local.fLegal.fNum > 1) {
            answer.fCData.fCard = this.cardToGlobal[pas.Hjasser.h_req_card(this.global,this.local)]}
           else answer.fCData.fCard = this.cardToGlobal[this.local.fLegal.fCard[0]];
        } else if ($tmp === 2020) {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        } else {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        };
      };
      this.NotifyCommand = function (aCmd) {
        var d = null;
        var n = null;
        var Call = null;
        var ca = null;
        var count = null;
        var i = 0;
        var max = 0;
        var delta = 0;
        var r = 0;
        var col = 0;
        var lcol = 0;
        var card = 0;
        var player = 0;
        var mine = 0;
        var allOthers = 0;
        var notPlayer = 0;
        if (this.fAdvisor !== null) this.fAdvisor.NotifyCommand(pas.DiffCmds.TCommand.$clone(aCmd));
        pas.Jassers.TProtoJasser.NotifyCommand.call(this,pas.DiffCmds.TCommand.$clone(aCmd));
        var $tmp = aCmd.fCmdID;
        if ($tmp === 1100) {
          n = aCmd.fCData;
          var $with = this.global.fRules;
          if (n.fRules.fNuPlayers !== 4) ;
          $with.fNumPlayers = n.fRules.fNuPlayers;
          $with.fNextPlayer[3] = 3;
          $with.fPrevPlayer[3] = 3;
          for (var $l = 0, $end = $with.fNumPlayers - 1; $l <= $end; $l++) {
            i = $l;
            $with.fNextPlayer[i] = (i + 1) % $with.fNumPlayers;
          };
          for (var $l1 = 0, $end1 = $with.fNumPlayers - 1; $l1 <= $end1; $l1++) {
            i = $l1;
            $with.fPrevPlayer[$with.fNextPlayer[i]] = i;
          };
          $with.fBonus = n.fRules.fDZeroBonus;
          $with.fBonusNullTrick = 0;
          $with.fOpenCalls = false;
          $with.fSCallBonus = (n.fRules.fCallMode === 2) && n.fRules.fSCallBonus;
        } else if ($tmp === 2000) {
          d = aCmd.fCData;
          this.trump = pas.DiffBase.gColourOf[d.fDrawn];
          for (r = 1; r <= 9; r++) {
            this.cardToLocal[pas.DiffBase.gCardOf[this.trump][r]] = pas.DiffBase.TrumpRank(r) - 1;
            this.cardToGlobal[pas.DiffBase.TrumpRank(r) - 1] = pas.DiffBase.gCardOf[this.trump][r];
          };
          lcol = 0;
          for (col = 1; col <= 4; col++) if (col !== this.trump) {
            lcol = lcol + 1;
            for (r = 1; r <= 9; r++) {
              this.cardToLocal[pas.DiffBase.gCardOf[col][r]] = ((lcol * 9) + r) - 1;
              this.cardToGlobal[((lcol * 9) + r) - 1] = pas.DiffBase.gCardOf[col][r];
            };
          };
          var $with1 = this.global.fRound;
          for (i = 0; i <= 3; i++) $with1.fPoints[i] = 0;
          for (i = 0; i <= 3; i++) $with1.fMadeTrick[i] = false;
          $with1.fNumPlayed = 0;
          $with1.fInTrick = 0;
          for (i = 0; i <= 3; i++) $with1.fPlayed[i].fNum = 0;
          this.global.fOpenCard = this.cardToLocal[d.fDrawn];
          this.global.fBegins = d.fDrawnFor % this.global.fRules.fNumPlayers;
          this.global.fLevel[this.fPlayer - 1] = this.fLevel;
          for (i = 0; i <= 3; i++) this.global.fTotal[i] = d.fTotal[i + 1];
          var $with2 = this.local;
          $with2.fPlayer = this.fPlayer - 1;
          this.HandToLocal($with2.fHandDealt,d.fHands[this.fPlayer].slice(0));
          $with2.fHand.$assign($with2.fHandDealt);
          $with2.fLegal.$assign($with2.fHandDealt);
          mine = pas.DecOnMac.pBit[$with2.fPlayer];
          if (this.global.fRules.fNumPlayers === 4) {
            allOthers = 15}
           else allOthers = 7;
          for (var $l2 = 35; $l2 >= 0; $l2--) {
            card = $l2;
            $with2.fMayHave[card] = allOthers;
          };
          for (var $l3 = 0, $end2 = $with2.fHand.fNum - 1; $l3 <= $end2; $l3++) {
            i = $l3;
            $with2.fMayHave[$with2.fHand.fCard[i]] = mine;
          };
          $with2.fMayHave[this.global.fOpenCard] = pas.DecOnMac.pBit[d.fDrawnFor - 1];
          for (i = 0; i <= 3; i++) $with2.fCall[i] = -1;
          pas.Hjasser.h_not_deal(this.global,this.local);
        } else if ($tmp === 2004) {
          ca = aCmd.fCData;
          player = ca.fPlayer - 1;
          card = this.cardToLocal[ca.fCard];
          if (ca.fPlayer === this.fPlayer) {
            var $with3 = this.local.fHand;
            $with3.fNum = $with3.fNum - 1;
            i = $with3.fNum;
            while ($with3.fCard[i] !== card) i = i - 1;
            $with3.fCard[i] = $with3.fCard[$with3.fNum];
          };
          var $with4 = this.global.fRound;
          $with4.fPlayed[player].fCard[$with4.fPlayed[player].fNum] = card;
          $with4.fPlayed[player].fNum = $with4.fPlayed[player].fNum + 1;
          $with4.fNumPlayed = $with4.fNumPlayed + 1;
          $with4.fInTrick = $with4.fNumPlayed % this.global.fRules.fNumPlayers;
          if ($with4.fInTrick === 1) {
            $with4.fTrickColor = pas.DecOnMac.pColorOf[card];
            $with4.fTrickCard = card;
            $with4.fTrickOwner = player;
            if ($with4.fNumPlayed >= 33) {
              $with4.fTrickValue = 5}
             else $with4.fTrickValue = 0;
          } else {
            if (pas.DecOnMac.PBetterCard(card,$with4.fTrickCard)) {
              $with4.fTrickCard = card;
              $with4.fTrickOwner = player;
            };
          };
          $with4.fTrickValue = $with4.fTrickValue + pas.DecOnMac.pValueOfCard[card];
          if ($with4.fInTrick === 0) {
            $with4.fPoints[$with4.fTrickOwner] = $with4.fPoints[$with4.fTrickOwner] + $with4.fTrickValue;
            $with4.fMadeTrick[$with4.fTrickOwner] = true;
          };
          $with4.fTrickPlayer = player;
          var $with5 = this.global.fRound;
          var $with6 = this.local;
          $with6.fMayHave[card] = 0;
          if ($with5.fInTrick !== 1) {
            col = pas.DecOnMac.pColorOf[card];
            if ((col !== $with5.fTrickColor) && ((col !== 0) || ((col === 0) && (card < $with5.fTrickCard)))) {
              if ($with5.fTrickColor === 0) {
                max = 9 - 1}
               else max = 9;
              notPlayer = 15 - pas.DecOnMac.pBit[player];
              for (var $l4 = max - 1; $l4 >= 0; $l4--) {
                i = $l4;
                $with6.fMayHave[pas.DecOnMac.CardOf($with5.fTrickColor,i)] = $with6.fMayHave[pas.DecOnMac.CardOf($with5.fTrickColor,i)] & notPlayer;
              };
            };
          };
          pas.Hjasser.h_not_card(this.global,this.local,player,card);
        } else if ($tmp === 2002) {
          Call = aCmd.fCData;
          this.local.fCall[Call.fPlayer - 1] = Call.fCall;
          pas.Hjasser.h_not_call(this.global,this.local,Call.fPlayer - 1);
        } else if ($tmp === 2005) {
          delta = this.global.fRound.fPoints[this.local.fPlayer] - this.local.fCall[this.local.fPlayer];
          pas.Hjasser.h_not_count(this.global,this.local);
        };
      };
      this.Free$1 = function () {
        if (this.fAdvisor !== null) this.fAdvisor.$destroy("Free$1");
        pas.DiffPlay.TJassHandler.Free$1.call(this);
      };
      this.HandToLocal = function (lhand, hand) {
        var i = 0;
        lhand.fNum = 0;
        for (i = 0; i <= 11; i++) if (hand[i] !== 0) {
          lhand.fCard[lhand.fNum] = this.cardToLocal[hand[i]];
          lhand.fNum = lhand.fNum + 1;
        };
      };
      var $r = this.$rtti;
      $mod.$rtti.$StaticArray("THackerObj.cardToLocal$a",{dims: [37], eltype: pas.DecOnMac.$rtti["DCard"]});
      $mod.$rtti.$StaticArray("THackerObj.cardToGlobal$a",{dims: [36], eltype: pas.DiffBase.$rtti["TCard"]});
    });
  };
},["DiffBase","DiffCmds","DiffPlay","DiffNet","Jassers","ResUtils","WinFile","DecOnMac","Hjasser","SysUtils"]);
rtl.module("DiffStat",["System"],function () {
  "use strict";
  var $mod = this;
});
rtl.module("DiffFile",["System"],function () {
  "use strict";
  var $mod = this;
});
rtl.module("fdcBase",["System","ResUtils","StdUtils","DiffBase","DiffCmds"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.kMaxValue = 32000;
  this.$rtti.$Int("NUMCARDS",{minvalue: 0, maxvalue: 9, ordtype: 1});
  this.$rtti.$Int("NUPLAYER",{minvalue: 3, maxvalue: 4, ordtype: 1});
  this.kMinOption = 0;
  this.kMaxOption = 15;
  this.$rtti.$Int("TPortOption",{minvalue: 0, maxvalue: 15, ordtype: 1});
  rtl.recNewT(this,"fdcOPTIONS",function () {
    $mod.$rtti.$Set("fdcOPTIONS.flags$a",{comptype: $mod.$rtti["TPortOption"]});
    this.infos = "";
    this.$new = function () {
      var r = Object.create(this);
      r.flags = {};
      return r;
    };
    this.$eq = function (b) {
      return rtl.eqSet(this.flags,b.flags) && (this.infos === b.infos);
    };
    this.$assign = function (s) {
      this.flags = rtl.refSet(s.flags);
      this.infos = s.infos;
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcOPTIONS",{},this);
    $r.addField("flags",$mod.$rtti["fdcOPTIONS.flags$a"]);
    $r.addField("infos",rtl.string);
  });
  this.INFOITEM = {"0": "dbgInfo", dbgInfo: 0, "1": "dbgBocks", dbgBocks: 1, "2": "dbgHands", dbgHands: 2, "3": "dbgCards", dbgCards: 3};
  this.$rtti.$Enum("INFOITEM",{minvalue: 0, maxvalue: 3, ordtype: 1, enumtype: this.INFOITEM});
  this.$rtti.$Set("INFOSET",{comptype: this.$rtti["INFOITEM"]});
  this.gAllInfo = {};
  this.gLearnOptions = this.fdcOPTIONS.$new();
  this.ClearOptions = function (opt) {
    opt.flags = {};
    opt.infos = "";
  };
  this.DefineOption = function (opt, info) {
    var Result = 0;
    var o = 0;
    var s = "";
    o = 0;
    s = pas.DiffBase.StringOfLong(o,1).concat(":");
    while ((o <= 15) && (pas.System.Pos(s,opt.infos) > 0)) {
      o = o + 1;
      s = pas.DiffBase.StringOfLong(o,1).concat(":");
    };
    if (o <= 15) {
      opt.flags = rtl.diffSet(opt.flags,rtl.createSet(o));
      opt.infos = opt.infos.concat(pas.DiffBase.StringOfLong(o,1),":",info," ");
    };
    Result = o;
    return Result;
  };
  rtl.recNewT(this,"fdcSTATE",function () {
    this.fNuPlayer = 0;
    this.fHandHigh = 0;
    this.fCallMode = 0;
    this.fCallBonus = false;
    this.fPMin = 0;
    this.fPMax = 0;
    this.fPlayer = 0;
    this.fLevel = 0;
    this.fTrump = 0;
    this.fDrawn = 0;
    this.fInHand = 0;
    this.fRemaining = 0;
    this.fTrickNu = 0;
    this.fCardCnt = 0;
    this.fBocks$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
      return b;
    };
    this.fCardsOf$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
      return b;
    };
    this.fKnown$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
      return b;
    };
    this.fWhere$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
      return b;
    };
    this.fGuess$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
      return b;
    };
    this.fTricks$a$clone = function (a) {
      var b = [];
      b.length = 12;
      for (var c = 0; c < 12; c++) b[c] = pas.DiffBase.TTrick.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fPNext = rtl.arraySetLength(null,0,5);
      r.fPPrev = rtl.arraySetLength(null,0,5);
      r.fCalled = rtl.arraySetLength(null,0,5);
      r.fPtsSoFar = rtl.arraySetLength(null,0,5);
      r.fStack = {};
      r.fBocks = rtl.arraySetLength(null,false,5,10);
      r.fCardsOf = rtl.arraySetLength(null,0,5);
      r.fNuCards = rtl.arraySetLength(null,0,5);
      r.fKnown = rtl.arraySetLength(null,0,5);
      r.fWhere = rtl.arraySetLength(null,0,5);
      r.fGuess = rtl.arraySetLength(null,0,5);
      r.fTricks = rtl.arraySetLength(null,pas.DiffBase.TTrick,12);
      r.fLeaded = rtl.arraySetLength(null,0,12);
      r.fPlayed = rtl.arraySetLength(null,0,5,12);
      r.fPulled = rtl.arraySetLength(null,0,5,12);
      r.fThrown = rtl.arraySetLength(null,0,5,12);
      return r;
    };
    this.$eq = function (b) {
      return (this.fNuPlayer === b.fNuPlayer) && (this.fHandHigh === b.fHandHigh) && (this.fCallMode === b.fCallMode) && (this.fCallBonus === b.fCallBonus) && rtl.arrayEq(this.fPNext,b.fPNext) && rtl.arrayEq(this.fPPrev,b.fPPrev) && (this.fPMin === b.fPMin) && (this.fPMax === b.fPMax) && (this.fPlayer === b.fPlayer) && (this.fLevel === b.fLevel) && (this.fTrump === b.fTrump) && (this.fDrawn === b.fDrawn) && (this.fInHand === b.fInHand) && rtl.arrayEq(this.fCalled,b.fCalled) && rtl.arrayEq(this.fPtsSoFar,b.fPtsSoFar) && (this.fRemaining === b.fRemaining) && (this.fTrickNu === b.fTrickNu) && (this.fCardCnt === b.fCardCnt) && rtl.eqSet(this.fStack,b.fStack) && rtl.arrayEq(this.fBocks,b.fBocks) && rtl.arrayEq(this.fCardsOf,b.fCardsOf) && rtl.arrayEq(this.fNuCards,b.fNuCards) && rtl.arrayEq(this.fKnown,b.fKnown) && rtl.arrayEq(this.fWhere,b.fWhere) && rtl.arrayEq(this.fGuess,b.fGuess) && rtl.arrayEq(this.fTricks,b.fTricks) && rtl.arrayEq(this.fLeaded,b.fLeaded) && rtl.arrayEq(this.fPlayed,b.fPlayed) && rtl.arrayEq(this.fPulled,b.fPulled) && rtl.arrayEq(this.fThrown,b.fThrown);
    };
    this.$assign = function (s) {
      this.fNuPlayer = s.fNuPlayer;
      this.fHandHigh = s.fHandHigh;
      this.fCallMode = s.fCallMode;
      this.fCallBonus = s.fCallBonus;
      this.fPNext = s.fPNext.slice(0);
      this.fPPrev = s.fPPrev.slice(0);
      this.fPMin = s.fPMin;
      this.fPMax = s.fPMax;
      this.fPlayer = s.fPlayer;
      this.fLevel = s.fLevel;
      this.fTrump = s.fTrump;
      this.fDrawn = s.fDrawn;
      this.fInHand = s.fInHand;
      this.fCalled = s.fCalled.slice(0);
      this.fPtsSoFar = s.fPtsSoFar.slice(0);
      this.fRemaining = s.fRemaining;
      this.fTrickNu = s.fTrickNu;
      this.fCardCnt = s.fCardCnt;
      this.fStack = rtl.refSet(s.fStack);
      this.fBocks = this.fBocks$a$clone(s.fBocks);
      this.fCardsOf = this.fCardsOf$a$clone(s.fCardsOf);
      this.fNuCards = s.fNuCards.slice(0);
      this.fKnown = this.fKnown$a$clone(s.fKnown);
      this.fWhere = this.fWhere$a$clone(s.fWhere);
      this.fGuess = this.fGuess$a$clone(s.fGuess);
      this.fTricks = this.fTricks$a$clone(s.fTricks);
      this.fLeaded = s.fLeaded.slice(0);
      this.fPlayed = pas.DiffBase.THands$clone(s.fPlayed);
      this.fPulled = pas.DiffBase.THands$clone(s.fPulled);
      this.fThrown = pas.DiffBase.THands$clone(s.fThrown);
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcSTATE",{},this);
    $r.addField("fNuPlayer",$mod.$rtti["NUPLAYER"]);
    $r.addField("fHandHigh",rtl.longint);
    $r.addField("fCallMode",rtl.longint);
    $r.addField("fCallBonus",rtl.boolean);
    $r.addField("fPNext",pas.DiffBase.$rtti["TPlayCircle"]);
    $r.addField("fPPrev",pas.DiffBase.$rtti["TPlayCircle"]);
    $r.addField("fPMin",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fPMax",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fPlayer",pas.DiffBase.$rtti["TPlayer"]);
    $r.addField("fLevel",rtl.longint);
    $r.addField("fTrump",pas.DiffBase.$rtti["TTrump"]);
    $r.addField("fDrawn",pas.DiffBase.$rtti["TCard"]);
    $r.addField("fInHand",pas.DiffBase.$rtti["TPlayer"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fCalled$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fCalled",$mod.$rtti["fdcSTATE.fCalled$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fPtsSoFar$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fPtsSoFar",$mod.$rtti["fdcSTATE.fPtsSoFar$a"]);
    $r.addField("fRemaining",rtl.longint);
    $r.addField("fTrickNu",rtl.longint);
    $r.addField("fCardCnt",rtl.longint);
    $r.addField("fStack",pas.DiffBase.$rtti["TCardSet"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fBocks$a",{dims: [5,10], eltype: rtl.boolean});
    $r.addField("fBocks",$mod.$rtti["fdcSTATE.fBocks$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fCardsOf$a",{dims: [5], eltype: pas.DiffBase.$rtti["TCardSet"]});
    $r.addField("fCardsOf",$mod.$rtti["fdcSTATE.fCardsOf$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fNuCards$a",{dims: [5], eltype: $mod.$rtti["NUMCARDS"]});
    $r.addField("fNuCards",$mod.$rtti["fdcSTATE.fNuCards$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fKnown$a",{dims: [5], eltype: pas.DiffBase.$rtti["TCardSet"]});
    $r.addField("fKnown",$mod.$rtti["fdcSTATE.fKnown$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fWhere$a",{dims: [5], eltype: pas.DiffBase.$rtti["TCardSet"]});
    $r.addField("fWhere",$mod.$rtti["fdcSTATE.fWhere$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fGuess$a",{dims: [5], eltype: pas.DiffBase.$rtti["TCardSet"]});
    $r.addField("fGuess",$mod.$rtti["fdcSTATE.fGuess$a"]);
    $mod.$rtti.$StaticArray("fdcSTATE.fTricks$a",{dims: [12], eltype: pas.DiffBase.$rtti["TTrick"]});
    $r.addField("fTricks",$mod.$rtti["fdcSTATE.fTricks$a"]);
    $r.addField("fLeaded",pas.DiffBase.$rtti["THand"]);
    $r.addField("fPlayed",pas.DiffBase.$rtti["THands"]);
    $r.addField("fPulled",pas.DiffBase.$rtti["THands"]);
    $r.addField("fThrown",pas.DiffBase.$rtti["THands"]);
  });
  this.ResetfdcState = function (f) {
    var p = 0;
    var i = 0;
    var c = 0;
    var r = 0;
    for (p = 0; p <= 4; p++) {
      f.fCalled[p] = -10000;
      f.fPtsSoFar[p] = 0;
    };
    f.fRemaining = 157;
    f.fTrump = 0;
    f.fDrawn = 0;
    f.fInHand = 0;
    f.fStack = {};
    for (c = 1; c <= 4; c++) {
      f.fCardsOf[c] = {};
      f.fNuCards[c] = 9;
      for (r = 0; r <= 9; r++) {
        f.fBocks[c][r] = r !== 0;
        if (r !== 0) f.fCardsOf[c] = rtl.unionSet(f.fCardsOf[c],rtl.createSet(pas.DiffBase.gCardOf[c][r]));
      };
    };
    for (p = 0; p <= 4; p++) {
      f.fKnown[p] = {};
      if ((p === 0) || (p === f.fPlayer)) {
        f.fWhere[p] = {}}
       else f.fWhere[p] = rtl.createSet(null,0 + 1,36);
      f.fGuess[p] = {};
    };
    for (i = 0; i <= 11; i++) {
      f.fTricks[i].fLeading = 0;
      f.fLeaded[i] = 0;
      for (p = 0; p <= 4; p++) {
        f.fTricks[i].fPlayed[p] = 0;
        f.fPlayed[p][i] = 0;
        f.fPulled[p][i] = 0;
        f.fThrown[p][i] = 0;
      };
    };
  };
  this.SetupfdcState = function (f, data) {
    var index = 0;
    $mod.ResetfdcState(f);
    f.fNuPlayer = data.fRules.fNuPlayers;
    f.fHandHigh = rtl.trunc(36 / f.fNuPlayer) - 1;
    f.fCallMode = data.fRules.fCallMode;
    f.fCallBonus = data.fRules.fSCallBonus;
    pas.DiffBase.SetupPrevNext(f.fNuPlayer,{p: f, get: function () {
        return this.p.fPPrev;
      }, set: function (v) {
        this.p.fPPrev = v;
      }},{p: f, get: function () {
        return this.p.fPNext;
      }, set: function (v) {
        this.p.fPNext = v;
      }});
    f.fPMin = 1;
    f.fPMax = (1 + f.fNuPlayer) - 1;
    f.fPlayer = data.fPlayer;
    f.fLevel = data.fLevel[f.fPlayer];
  };
  this.DealfdcState = function (f, data) {
    var p = 0;
    $mod.ResetfdcState(f);
    f.fTrump = pas.DiffBase.gColourOf[data.fDrawn];
    f.fDrawn = data.fDrawn;
    f.fInHand = data.fDrawnFor;
    f.fTricks[0].fLeading = f.fPNext[f.fInHand];
    f.fTrickNu = 0;
    f.fCardCnt = 0;
    f.fKnown[f.fPlayer] = rtl.refSet(pas.DiffBase.HandToCardSet(data.fHands[f.fPlayer].slice(0)));
    f.fKnown[f.fInHand] = rtl.unionSet(f.fKnown[f.fInHand],rtl.createSet(data.fDrawn));
    for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
      p = $l;
      f.fWhere[p] = rtl.diffSet(rtl.diffSet(f.fWhere[p],f.fKnown[f.fPlayer]),rtl.createSet(data.fDrawn));
    };
  };
  this.EditfdcState = function (f, data) {
    var p = 0;
    f.fKnown[f.fPlayer] = rtl.refSet(pas.DiffBase.HandToCardSet(data.fHands[f.fPlayer].slice(0)));
    for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
      p = $l;
      f.fWhere[p] = rtl.diffSet(f.fWhere[p],f.fKnown[f.fPlayer]);
    };
  };
  this.CallfdcState = function (f, data) {
    f.fCalled[data.fPlayer] = data.fCall;
  };
  this.CardfdcState = function (f, data) {
    var p = 0;
    var q = 0;
    var c = 0;
    var r = 0;
    var s = {};
    var i = 0;
    var j = 0;
    if (f.fTrickNu > f.fHandHigh) return;
    for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
      p = $l;
      f.fWhere[p] = rtl.diffSet(f.fWhere[p],rtl.createSet(data.fCard));
    };
    f.fStack = rtl.unionSet(f.fStack,rtl.createSet(data.fCard));
    f.fCardsOf[pas.DiffBase.gColourOf[data.fCard]] = rtl.diffSet(f.fCardsOf[pas.DiffBase.gColourOf[data.fCard]],rtl.createSet(data.fCard));
    p = data.fPlayer;
    f.fKnown[p] = rtl.unionSet(f.fKnown[p],rtl.createSet(data.fCard));
    f.fTricks[f.fTrickNu].fPlayed[p] = data.fCard;
    f.fPlayed[p][f.fTrickNu] = data.fCard;
    if (f.fCardCnt === 0) {
      f.fTricks[f.fTrickNu].fLeading = p;
      f.fLeaded[f.fTrickNu] = data.fCard;
      r = 9;
      while (!f.fBocks[pas.DiffBase.gColourOf[data.fCard]][r]) r = r - 1;
      if ((r > $mod.gCardRank[f.fTrump][data.fCard]) && (pas.DiffBase.gColourOf[data.fCard] !== f.fTrump)) {
        i = 0;
        while (f.fPulled[p][i] !== 0) i = i + 1;
        f.fPulled[p][i] = data.fCard;
      };
    } else if ((pas.DiffBase.gColourOf[data.fCard] !== f.fTrump) && (pas.DiffBase.gColourOf[data.fCard] !== pas.DiffBase.gColourOf[f.fLeaded[f.fTrickNu]])) {
      i = 0;
      while (f.fThrown[p][i] !== 0) i = i + 1;
      f.fThrown[p][i] = data.fCard;
      c = pas.DiffBase.gColourOf[f.fLeaded[f.fTrickNu]];
      s = {};
      for (r = 1; r <= 9; r++) s = rtl.unionSet(s,rtl.createSet(pas.DiffBase.gCardOf[c][r]));
      if (c === f.fTrump) s = rtl.diffSet(s,rtl.createSet(pas.DiffBase.gCardOf[f.fTrump][6]));
      f.fWhere[p] = rtl.diffSet(f.fWhere[p],s);
      i = 0;
      for (var $l1 = f.fPMin, $end1 = f.fPMax; $l1 <= $end1; $l1++) {
        p = $l1;
        if (rtl.neSet(rtl.intersectSet(f.fWhere[p],f.fCardsOf[c]),{})) {
          i = i + 1;
          q = p;
        };
      };
      if (i === 1) {
        f.fKnown[q] = rtl.unionSet(f.fKnown[q],rtl.intersectSet(f.fCardsOf[c],f.fWhere[q]));
        f.fWhere[q] = rtl.diffSet(f.fWhere[q],f.fCardsOf[c]);
      };
    };
    f.fCardCnt = (f.fCardCnt + 1) % f.fNuPlayer;
    if (f.fCardCnt === 0) {
      for (var $l2 = f.fPMin, $end2 = f.fPMax; $l2 <= $end2; $l2++) {
        p = $l2;
        f.fNuCards[pas.DiffBase.gColourOf[f.fPlayed[p][f.fTrickNu]]] = f.fNuCards[pas.DiffBase.gColourOf[f.fPlayed[p][f.fTrickNu]]] - 1;
        f.fBocks[pas.DiffBase.gColourOf[f.fPlayed[p][f.fTrickNu]]][$mod.gCardRank[f.fTrump][f.fPlayed[p][f.fTrickNu]]] = false;
      };
      p = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[f.fTrickNu]));
      i = pas.DiffBase.ValueOfTrick(f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[f.fTrickNu]));
      f.fPtsSoFar[p] = f.fPtsSoFar[p] + i;
      f.fRemaining = f.fRemaining - i;
      if (f.fTrickNu < f.fHandHigh) {
        f.fTrickNu = f.fTrickNu + 1;
        f.fTricks[f.fTrickNu].fLeading = p;
      };
    };
  };
  this.CountfdcState = function (f, data) {
    var index = 0;
    var srank = 0;
    var addIt = $mod.ESTIMATE.$new();
    var value = 0;
  };
  this.p1st = 32;
  this.p2nd = 16;
  this.p3rd = 8;
  this.kPattHigh = 63;
  this.kPatternLength = 14;
  this.$rtti.$Int("TPattern",{minvalue: 0, maxvalue: 63, ordtype: 1});
  this.CardRankTab$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("CardRankTab",{dims: [5,37], eltype: pas.DiffBase.$rtti["TRank"]});
  this.RankCardTab$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) {
      var d = b[c] = [];
      d.length = 5;
      var e = a[c];
      for (var f = 0; f < 5; f++) d[f] = e[f].slice(0);
    };
    return b;
  };
  this.$rtti.$StaticArray("RankCardTab",{dims: [5,5,10], eltype: pas.DiffBase.$rtti["TCard"]});
  this.$rtti.$StaticArray("NuCardsTab",{dims: [64], eltype: this.$rtti["NUMCARDS"]});
  this.gCardRank = rtl.arraySetLength(null,0,5,37);
  this.gRankCard = rtl.arraySetLength(null,0,5,5,10);
  this.gNuCards = rtl.arraySetLength(null,0,64);
  this.DoGetPattern = function (f, trump, colour, s) {
    var Result = 0;
    var rank = 0;
    var patt = 0;
    var next = 0;
    var rest = 0;
    patt = 0;
    rest = 0;
    next = 32;
    for (var $l = 9; $l >= 1; $l--) {
      rank = $l;
      if ((trump === 0) || f.fBocks[colour][rank]) {
        if ($mod.gRankCard[trump][colour][rank] in s) {
          if (next < 8) {
            rest = rest + 1}
           else patt = patt + next;
        };
        next = rtl.trunc(next / 2);
      };
    };
    if (rest >= 8) rest = 7;
    patt = patt + rest;
    Result = patt;
    return Result;
  };
  this.DoGetNthCard = function (f, colour, player, nth) {
    var Result = 0;
    var rank = 0;
    var cards = {};
    Result = 0;
    if (nth <= 0) return Result;
    cards = rtl.diffSet(rtl.unionSet(f.fKnown[player],f.fGuess[player]),f.fStack);
    rank = 9;
    do {
      if (f.fBocks[colour][rank] && ($mod.gRankCard[f.fTrump][colour][rank] in cards)) nth = nth - 1;
      if (nth > 0) rank = rank - 1;
    } while (!((rank < 1) || (nth === 0)));
    if (rank >= 1) Result = $mod.gRankCard[f.fTrump][colour][rank];
    return Result;
  };
  this.WritePattern = function (patt) {
    var s = "";
    s = "";
    if (patt >= 32) {
      s = s.concat("1st ")}
     else s = s.concat("... ");
    if ((patt % 32) >= 16) {
      s = s.concat("2nd ")}
     else s = s.concat("... ");
    if ((patt % 16) >= 8) {
      s = s.concat("3rd ")}
     else s = s.concat("... ");
    if ((patt % 8) >= 1) {
      s = s.concat(pas.DiffBase.StringOfLong(patt % 8,1))}
     else s = s.concat("..");
    pas.DiffBase.LogWrite(s);
  };
  this.kPlayMin = 10;
  this.kPlayMax = 10000;
  this.kEstimateLength = 16;
  rtl.recNewT(this,"ESTIMATE",function () {
    this.played = 0;
    this.evalue = 0.0;
    this.$eq = function (b) {
      return (this.played === b.played) && (this.evalue === b.evalue);
    };
    this.$assign = function (s) {
      this.played = s.played;
      this.evalue = s.evalue;
      return this;
    };
    var $r = $mod.$rtti.$Record("ESTIMATE",{},this);
    $r.addField("played",rtl.longint);
    $r.addField("evalue",pas.System.$rtti["Single"]);
  });
  this.SetEstimate = function (e, evalue, played) {
    e.evalue = evalue;
    e.played = played;
  };
  this.AddEstimate = function (e, a) {
    e.evalue = e.evalue + a.evalue;
    e.played = Math.abs(e.played) + Math.abs(a.played);
    if (e.played >= 10000) e.played = 10000 - 1;
  };
  this.LearnEstimate = function (e, a) {
    if (a.played === 0) return;
    e.played = Math.abs(e.played);
    a.played = Math.abs(a.played);
    e.evalue = (e.played * e.evalue) + (a.played * a.evalue);
    e.played = e.played + a.played;
    e.evalue = e.evalue / e.played;
    if (e.played >= 10000) e.played = 10000 - 1;
  };
  this.AdaptEstimate = function (e, delta) {
    e.evalue = e.evalue + delta;
    if (e.evalue < 0) e.evalue = 0;
    e.played = e.played + 1;
    if (e.played >= 10000) e.played = 10000 - 1;
  };
  this.NormalizeEstimate = function (e, norm) {
    e.evalue = e.evalue * norm;
  };
  this.WriteValue = function (v, leading, precision) {
    if (v < 0) {
      pas.DiffBase.LogWrite("-");
      v = Math.abs(v);
    } else {
      pas.DiffBase.LogWrite(" ");
    };
    pas.DiffBase.LogWrite(pas.DiffBase.StringOfReal(v,leading + precision + 1,precision));
  };
  this.WriteCount = function (c) {
    var f = 0;
    if (c < 10000) {
      pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(c,4))}
     else {
      f = 1;
      while (c >= 100) {
        c = rtl.trunc(c / 10);
        f = f + 1;
      };
      pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(c,2).concat("e",pas.DiffBase.StringOfLong(f - 1,1)));
    };
  };
  this.PLAYMODE = {"0": "goForZero", goForZero: 0, "1": "goForMore", goForMore: 1};
  this.$rtti.$Enum("PLAYMODE",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.PLAYMODE});
  this.PLAYRANK = {"0": "playFirst", playFirst: 0, "1": "playOther", playOther: 1};
  this.$rtti.$Enum("PLAYRANK",{minvalue: 0, maxvalue: 1, ordtype: 1, enumtype: this.PLAYRANK});
  this.CARDTYPE = {"0": "cardTrump", cardTrump: 0, "1": "cardTSupp", cardTSupp: 1, "2": "cardOther", cardOther: 2};
  this.$rtti.$Enum("CARDTYPE",{minvalue: 0, maxvalue: 2, ordtype: 1, enumtype: this.CARDTYPE});
  this.PatternTab$clone = function (a) {
    var b = [];
    b.length = 64;
    for (var c = 0; c < 64; c++) b[c] = $mod.ESTIMATE.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("PatternTab",{dims: [64], eltype: this.$rtti["ESTIMATE"]});
  this.PlayTab$clone = function (a) {
    var b = [];
    b.length = 2;
    for (var c = 0; c < 2; c++) {
      var d = b[c] = [];
      d.length = 3;
      var e = a[c];
      for (var f = 0; f < 3; f++) {
        var g = d[f] = [];
        g.length = 10;
        var h = e[f];
        for (var i = 0; i < 10; i++) g[i] = $mod.PatternTab$clone(h[i]);
      };
    };
    return b;
  };
  this.$rtti.$StaticArray("PlayTab",{dims: [2,3,10,64], eltype: this.$rtti["ESTIMATE"]});
  rtl.recNewT(this,"TPortPlayTab",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.v = rtl.arraySetLength(null,$mod.ESTIMATE,2,3,10,64);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.v,b.v);
    };
    this.$assign = function (s) {
      this.v = $mod.PlayTab$clone(s.v);
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortPlayTab",{},this);
    $r.addField("v",$mod.$rtti["PlayTab"]);
  });
  this.$rtti.$Pointer("PlayTabPtr",{reftype: this.$rtti["TPortPlayTab"]});
  rtl.recNewT(this,"fdcData",function () {
    this.fCallTab$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) b[c] = $mod.TPortPlayTab.$clone(a[c]);
      return b;
    };
    this.fPlayTab$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) {
        var d = b[c] = [];
        d.length = 2;
        var e = a[c];
        for (var f = 0; f < 2; f++) d[f] = $mod.TPortPlayTab.$clone(e[f]);
      };
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fCallTab = rtl.arraySetLength(null,$mod.TPortPlayTab,2);
      r.fPlayTab = rtl.arraySetLength(null,$mod.TPortPlayTab,2,2);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fCallTab,b.fCallTab) && rtl.arrayEq(this.fPlayTab,b.fPlayTab);
    };
    this.$assign = function (s) {
      this.fCallTab = this.fCallTab$a$clone(s.fCallTab);
      this.fPlayTab = this.fPlayTab$a$clone(s.fPlayTab);
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcData",{},this);
    $mod.$rtti.$StaticArray("fdcData.fCallTab$a",{dims: [2], eltype: $mod.$rtti["TPortPlayTab"]});
    $r.addField("fCallTab",$mod.$rtti["fdcData.fCallTab$a"]);
    $mod.$rtti.$StaticArray("fdcData.fPlayTab$a",{dims: [2,2], eltype: $mod.$rtti["TPortPlayTab"]});
    $r.addField("fPlayTab",$mod.$rtti["fdcData.fPlayTab$a"]);
  });
  this.$rtti.$Pointer("fdcDataPtr",{reftype: this.$rtti["fdcData"]});
  this.gfdcData = null;
  this.GetPlayMode = function (f, forPlayer) {
    var Result = 0;
    if ((f.fCalled[forPlayer] - f.fPtsSoFar[forPlayer]) > 0) {
      Result = $mod.PLAYMODE.goForMore}
     else Result = $mod.PLAYMODE.goForZero;
    return Result;
  };
  this.GetIndexes = function (trump, colour, nuTrumps, myTrumps, nuCards, ctype, count) {
    if (colour === trump) {
      ctype.set($mod.CARDTYPE.cardTrump);
      count.set(nuTrumps);
    } else if ((nuTrumps - myTrumps) <= 0) {
      ctype.set($mod.CARDTYPE.cardOther);
      count.set(nuCards);
    } else {
      ctype.set($mod.CARDTYPE.cardTSupp);
      count.set(nuTrumps - myTrumps);
    };
  };
  this.$rtti.$Pointer("fdcSTATS",{reftype: this.$rtti["fdcSDATA"]});
  rtl.recNewT(this,"fdcSDATA",function () {
    this.fNext = null;
    this.fHeader = "";
    this.fPCount = 0;
    this.fPlayed = 0;
    this.fRounds = 0;
    this.fDelta = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fFinal = rtl.arraySetLength(null,0,4);
      return r;
    };
    this.$eq = function (b) {
      return (this.fNext === b.fNext) && (this.fHeader === b.fHeader) && (this.fPCount === b.fPCount) && (this.fPlayed === b.fPlayed) && (this.fRounds === b.fRounds) && (this.fDelta === b.fDelta) && rtl.arrayEq(this.fFinal,b.fFinal);
    };
    this.$assign = function (s) {
      this.fNext = s.fNext;
      this.fHeader = s.fHeader;
      this.fPCount = s.fPCount;
      this.fPlayed = s.fPlayed;
      this.fRounds = s.fRounds;
      this.fDelta = s.fDelta;
      this.fFinal = s.fFinal.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcSDATA",{},this);
    $r.addField("fNext",rtl.pointer);
    $r.addField("fHeader",rtl.string);
    $r.addField("fPCount",$mod.$rtti["NUPLAYER"]);
    $r.addField("fPlayed",rtl.longint);
    $r.addField("fRounds",rtl.longint);
    $r.addField("fDelta",rtl.longint);
    $mod.$rtti.$StaticArray("fdcSDATA.fFinal$a",{dims: [4], eltype: rtl.longint});
    $r.addField("fFinal",$mod.$rtti["fdcSDATA.fFinal$a"]);
  });
  this.gfdcStats = null;
  this.TruncateToLastSpace = function (s) {
    var Result = "";
    var i = 0;
    i = s.length;
    while ((i >= 1) && (s.charAt(i - 1) !== " ")) i = i - 1;
    if (i > 2) {
      Result = pas.System.Copy(s,1,i - 1)}
     else Result = s;
    return Result;
  };
  this.LookupfdcStats = function (header, pCount) {
    var Result = null;
    Result = null;
    return Result;
  };
  this.UpdatefdcStats = function (f, s, c, w) {
    if (s === null) return;
    if (c !== null) {
      s.fRounds = s.fRounds + 1;
      s.fDelta = s.fDelta + pas.DiffBase.DeltaOf(c.fCall[f.fPlayer],c.fMade[f.fPlayer],c.fBonus[f.fPlayer]);
    };
    if (w !== null) {
      s.fPlayed = s.fPlayed + 1;
      s.fFinal[w.fTable[f.fPlayer] - 1] = s.fFinal[w.fTable[f.fPlayer] - 1] + 1;
    };
  };
  this.$rtti.$StaticArray("gNextColour$a",{dims: [5], eltype: pas.DiffBase.$rtti["TColour"]});
  this.gNextColour = rtl.arraySetLength(null,0,5);
  this.$rtti.$StaticArray("gPrevColour$a",{dims: [5], eltype: pas.DiffBase.$rtti["TColour"]});
  this.gPrevColour = rtl.arraySetLength(null,0,5);
  this.$rtti.$StaticArray("gPChars$a",{dims: [5], eltype: rtl.char});
  this.gPChars = rtl.arraySetLength(null,"\x00",5);
  this.$rtti.$StaticArray("gTChars$a",{dims: [5], eltype: rtl.char});
  this.gTChars = rtl.arraySetLength(null,"\x00",5);
  this.$rtti.$StaticArray("gRChars$a",{dims: [10], eltype: rtl.char});
  this.gRChars = rtl.arraySetLength(null,"\x00",10);
  this.gfdcRnd = 0;
  this.gfdcRes = 0;
  this.InitfdcBase = function () {
    var patt = 0;
    var nuply = 0;
    var pmode = 0;
    var prank = 0;
    var ctype = 0;
    var count = 0;
    var colour = 0;
    var trump = 0;
    var card = 0;
    var rank = 0;
    var index = 0;
    var tricks = 0;
    var sdata = $mod.fdcSDATA.$new();
    var stats = null;
    var ssave = null;
    var saveRes = 0;
    var ignore = false;
    var f = 0;
    var fileName = "";
    function CardRank(trump, card) {
      var Result = 0;
      Result = 0;
      if (card === 0) return Result;
      if (pas.DiffBase.gColourOf[card] !== trump) {
        Result = pas.DiffBase.gRankOf[card]}
       else Result = pas.DiffBase.TrumpRank(pas.DiffBase.gRankOf[card]);
      return Result;
    };
    function RankCard(trump, colour, rank) {
      var Result = 0;
      Result = 0;
      if (rank <= 0) return Result;
      if (colour !== trump) {
        Result = pas.DiffBase.gCardOf[colour][rank]}
       else {
        var $tmp = rank;
        if ($tmp === 9) {
          Result = pas.DiffBase.gCardOf[colour][6]}
         else if ($tmp === 8) {
          Result = pas.DiffBase.gCardOf[colour][4]}
         else if ($tmp === 7) {
          Result = pas.DiffBase.gCardOf[colour][9]}
         else if ($tmp === 6) {
          Result = pas.DiffBase.gCardOf[colour][8]}
         else if ($tmp === 5) {
          Result = pas.DiffBase.gCardOf[colour][7]}
         else if ($tmp === 4) {
          Result = pas.DiffBase.gCardOf[colour][5]}
         else {
          Result = pas.DiffBase.gCardOf[colour][rank];
        };
      };
      return Result;
    };
    function GetNuCards(patt) {
      var Result = 0;
      var count = 0;
      count = 0;
      if (patt >= 32) count = count + 1;
      if ((patt % 32) >= 16) count = count + 1;
      if ((patt % 16) >= 8) count = count + 1;
      if ((count + (patt % 8)) > 9) {
        Result = 9}
       else Result = count + (patt % 8);
      return Result;
    };
    for (trump = 0; trump <= 4; trump++) {
      for (card = 0; card <= 36; card++) {
        $mod.gCardRank[trump][card] = CardRank(trump,card);
      };
    };
    for (trump = 0; trump <= 4; trump++) {
      for (colour = 0; colour <= 4; colour++) {
        for (rank = 0; rank <= 9; rank++) {
          $mod.gRankCard[trump][colour][rank] = RankCard(trump,colour,rank);
        };
      };
    };
    for (patt = 0; patt <= 63; patt++) {
      $mod.gNuCards[patt] = GetNuCards(patt);
    };
    $mod.gNextColour[0] = 0;
    $mod.gNextColour[1] = 2;
    $mod.gNextColour[2] = 3;
    $mod.gNextColour[3] = 4;
    $mod.gNextColour[4] = 1;
    $mod.gPrevColour[0] = 0;
    $mod.gPrevColour[1] = 4;
    $mod.gPrevColour[2] = 1;
    $mod.gPrevColour[3] = 2;
    $mod.gPrevColour[4] = 3;
    $mod.gPChars[0] = "#";
    $mod.gPChars[1] = "N";
    $mod.gPChars[2] = "W";
    $mod.gPChars[3] = "S";
    $mod.gPChars[4] = "E";
    $mod.gTChars[0] = "#";
    $mod.gTChars[1] = "S";
    $mod.gTChars[2] = "s";
    $mod.gTChars[3] = "R";
    $mod.gTChars[4] = "E";
    $mod.gRChars[0] = "#";
    $mod.gRChars[1] = "6";
    $mod.gRChars[2] = "7";
    $mod.gRChars[3] = "8";
    $mod.gRChars[4] = "9";
    $mod.gRChars[5] = "1";
    $mod.gRChars[6] = "B";
    $mod.gRChars[7] = "O";
    $mod.gRChars[8] = "K";
    $mod.gRChars[9] = "A";
    $mod.gAllInfo = rtl.createSet(null,$mod.INFOITEM.dbgInfo,$mod.INFOITEM.dbgCards);
    $mod.ClearOptions($mod.gLearnOptions);
    if (false) {
      for (nuply = 3; nuply <= 4; nuply++) {
        for (prank = 0; prank <= 1; prank++) {
          for (ctype = 0; ctype <= 2; ctype++) {
            for (count = 0; count <= 9; count++) {
              for (patt = 0; patt <= 63; patt++) {
                $mod.SetEstimate($mod.gfdcData.fCallTab[nuply - 3].v[prank][ctype][count][patt],0.0,0);
                for (pmode = 0; pmode <= 1; pmode++) {
                  $mod.SetEstimate($mod.gfdcData.fPlayTab[nuply - 3][pmode].v[prank][ctype][count][patt],0.0,0);
                };
              };
            };
          };
        };
      };
    };
  };
  this.FreefdcBase = function () {
    var saveRes = 0;
    var index = 0;
    var ignore = false;
    var stats = null;
    var f = 0;
    $mod.gfdcData = null;
  };
  $mod.$implcode = function () {
    $impl.WriteEstimate = function (e) {
      $mod.WriteValue(e.evalue,3,4);
      pas.DiffBase.LogWrite(" (");
      $mod.WriteCount(e.played);
      pas.DiffBase.LogWrite(")");
    };
    $impl.kfdcMagicKey = (((((4 * 256) + 3) * 256) + 2) * 256) + 1;
    $impl.kStatsType = "fdc#";
    $impl.kStatsFirst = 8000;
    $impl.kfdcDataType = "fdcT";
    $impl.kfdcDataTable = 8000;
    $impl.kDataEnding = ".dat";
  };
},["Dialogs","DiffStat","DiffFile","WinFile","PcFiles"]);
rtl.module("fdcGuess",["System","DiffBase","fdcBase"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"PLAYINFO",function () {
    this.fPercent = 0.0;
    this.fPattVal$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) {
        var d = b[c] = [];
        d.length = 5;
        var e = a[c];
        for (var f = 0; f < 5; f++) d[f] = pas.fdcBase.ESTIMATE.$clone(e[f]);
      };
      return b;
    };
    this.fPattSum$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) b[c] = pas.fdcBase.ESTIMATE.$clone(a[c]);
      return b;
    };
    this.fGuessed = 0.0;
    this.fLeading = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fCards = {};
      r.fLegal = rtl.arraySetLength(null,0,12);
      r.fPattern = rtl.arraySetLength(null,0,5);
      r.fPattVal = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,2,5);
      r.fPattSum = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,2);
      r.fSureBocks = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return (this.fPercent === b.fPercent) && rtl.eqSet(this.fCards,b.fCards) && rtl.arrayEq(this.fLegal,b.fLegal) && rtl.arrayEq(this.fPattern,b.fPattern) && rtl.arrayEq(this.fPattVal,b.fPattVal) && rtl.arrayEq(this.fPattSum,b.fPattSum) && (this.fGuessed === b.fGuessed) && (this.fLeading === b.fLeading) && rtl.arrayEq(this.fSureBocks,b.fSureBocks);
    };
    this.$assign = function (s) {
      this.fPercent = s.fPercent;
      this.fCards = rtl.refSet(s.fCards);
      this.fLegal = s.fLegal.slice(0);
      this.fPattern = s.fPattern.slice(0);
      this.fPattVal = this.fPattVal$a$clone(s.fPattVal);
      this.fPattSum = this.fPattSum$a$clone(s.fPattSum);
      this.fGuessed = s.fGuessed;
      this.fLeading = s.fLeading;
      this.fSureBocks = s.fSureBocks.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("PLAYINFO",{},this);
    $r.addField("fPercent",pas.System.$rtti["Single"]);
    $r.addField("fCards",pas.DiffBase.$rtti["TCardSet"]);
    $r.addField("fLegal",pas.DiffBase.$rtti["THand"]);
    $mod.$rtti.$StaticArray("PLAYINFO.fPattern$a",{dims: [5], eltype: pas.fdcBase.$rtti["TPattern"]});
    $r.addField("fPattern",$mod.$rtti["PLAYINFO.fPattern$a"]);
    $mod.$rtti.$StaticArray("PLAYINFO.fPattVal$a",{dims: [2,5], eltype: pas.fdcBase.$rtti["ESTIMATE"]});
    $r.addField("fPattVal",$mod.$rtti["PLAYINFO.fPattVal$a"]);
    $mod.$rtti.$StaticArray("PLAYINFO.fPattSum$a",{dims: [2], eltype: pas.fdcBase.$rtti["ESTIMATE"]});
    $r.addField("fPattSum",$mod.$rtti["PLAYINFO.fPattSum$a"]);
    $r.addField("fGuessed",pas.System.$rtti["Single"]);
    $r.addField("fLeading",pas.DiffBase.$rtti["TColour"]);
    $mod.$rtti.$StaticArray("PLAYINFO.fSureBocks$a",{dims: [5], eltype: pas.fdcBase.$rtti["NUMCARDS"]});
    $r.addField("fSureBocks",$mod.$rtti["PLAYINFO.fSureBocks$a"]);
  });
  this.gGuessOptions = pas.fdcBase.fdcOPTIONS.$new();
  this.DoPlayInfo = function (f, legal, pinfo) {
    var colour = 0;
    var player = 0;
    var cards = {};
    var card = 0;
    var rank = 0;
    var ctype = 0;
    var count = 0;
    var index = 0;
    var pmode = 0;
    var estim = pas.fdcBase.ESTIMATE.$new();
    var total = 0.0;
    var col2nd = 0;
    if (f.fCalled[f.fPlayer] <= 0) {
      pinfo.fPercent = pas.StdUtils.MaxL(1,f.fPtsSoFar[f.fPlayer])}
     else pinfo.fPercent = f.fPtsSoFar[f.fPlayer] / f.fCalled[f.fPlayer];
    pinfo.fCards = rtl.diffSet(f.fKnown[f.fPlayer],f.fStack);
    pinfo.fLegal = legal.slice(0);
    pas.DiffBase.SortHand({p: pinfo, get: function () {
        return this.p.fLegal;
      }, set: function (v) {
        this.p.fLegal = v;
      }});
    for (colour = 0; colour <= 4; colour++) {
      pinfo.fPattern[colour] = 0;
      pas.fdcBase.SetEstimate(pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForZero][colour],0,0);
      pas.fdcBase.SetEstimate(pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForMore][colour],0,0);
    };
    pas.fdcBase.SetEstimate(pinfo.fPattSum[pas.fdcBase.PLAYMODE.goForZero],0,0);
    pas.fdcBase.SetEstimate(pinfo.fPattSum[pas.fdcBase.PLAYMODE.goForMore],0,0);
    for (colour = 1; colour <= 4; colour++) {
      pinfo.fPattern[colour] = pas.fdcBase.DoGetPattern(f,f.fTrump,colour,rtl.diffSet(f.fKnown[f.fPlayer],f.fStack));
    };
    for (colour = 1; colour <= 4; colour++) {
      pas.fdcBase.GetIndexes(f.fTrump,colour,f.fNuCards[f.fTrump],pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],f.fNuCards[colour],{get: function () {
          return ctype;
        }, set: function (v) {
          ctype = v;
        }},{get: function () {
          return count;
        }, set: function (v) {
          count = v;
        }});
      $mod.GetEstimateFor(f,colour,pas.fdcBase.PLAYMODE.goForZero,pinfo.fPattern[colour],f.fCardCnt === 0,pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForZero][colour]);
      pas.fdcBase.AddEstimate(pinfo.fPattSum[pas.fdcBase.PLAYMODE.goForZero],pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForZero][colour]);
      $mod.GetEstimateFor(f,colour,pas.fdcBase.PLAYMODE.goForMore,pinfo.fPattern[colour],f.fCardCnt === 0,pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForMore][colour]);
      pas.fdcBase.AddEstimate(pinfo.fPattSum[pas.fdcBase.PLAYMODE.goForMore],pinfo.fPattVal[pas.fdcBase.PLAYMODE.goForMore][colour]);
    };
    pinfo.fGuessed = f.fPtsSoFar[f.fPlayer] + $mod.GetRemainingFor(f,f.fPlayer,pinfo.fPattSum[pas.fdcBase.GetPlayMode(f,f.fPlayer)].evalue);
    pinfo.fLeading = 0;
    if (f.fCardCnt === 0) {
      pinfo.fGuessed = 2147483647;
      pmode = pas.fdcBase.GetPlayMode(f,f.fPlayer);
      for (colour = 1; colour <= 4; colour++) {
        if (pinfo.fPattern[colour] > 0) {
          total = pinfo.fPattVal[pmode][colour].evalue;
          for (col2nd = 1; col2nd <= 4; col2nd++) {
            if ((col2nd !== colour) && (pinfo.fPattern[col2nd] > 0)) {
              $mod.GetEstimateFor(f,col2nd,pmode,pinfo.fPattern[col2nd],false,pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],estim);
              total = total + ((pinfo.fPattVal[pmode][col2nd].evalue + ((f.fNuPlayer - 1) * estim.evalue)) / f.fNuPlayer);
            };
          };
          total = f.fPtsSoFar[f.fPlayer] + $mod.GetRemainingFor(f,f.fPlayer,total);
          if (Math.abs(f.fCalled[f.fPlayer] - total) < Math.abs(f.fCalled[f.fPlayer] - pinfo.fGuessed)) {
            pinfo.fGuessed = total;
            pinfo.fLeading = colour;
          };
        };
      };
    };
    player = f.fTricks[f.fTrickNu].fLeading;
    while ((player !== 0) && (player !== f.fPlayer)) {
      card = f.fTricks[f.fTrickNu].fPlayed[player];
      colour = pas.DiffBase.gColourOf[card];
      f.fNuCards[colour] = f.fNuCards[colour] - 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][card]] = false;
      player = f.fPNext[player];
    };
    for (colour = 1; colour <= 4; colour++) {
      pinfo.fSureBocks[colour] = 0;
      rank = 9;
      while ((rank >= 1) && (!f.fBocks[colour][rank] || (pas.fdcBase.gRankCard[f.fTrump][colour][rank] in pinfo.fCards))) {
        if (f.fBocks[colour][rank]) pinfo.fSureBocks[colour] = pinfo.fSureBocks[colour] + 1;
        rank = rank - 1;
      };
      if (pinfo.fSureBocks[colour] >= (f.fNuCards[colour] - pas.fdcBase.gNuCards[pinfo.fPattern[colour]])) pinfo.fSureBocks[colour] = pas.fdcBase.gNuCards[pinfo.fPattern[colour]];
    };
    player = f.fTricks[f.fTrickNu].fLeading;
    while ((player !== 0) && (player !== f.fPlayer)) {
      card = f.fTricks[f.fTrickNu].fPlayed[player];
      colour = pas.DiffBase.gColourOf[card];
      f.fNuCards[colour] = f.fNuCards[colour] + 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][card]] = true;
      player = f.fPNext[player];
    };
  };
  var bocks$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  var guess$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
    return b;
  };
  var thrown$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
    return b;
  };
  this.GuessCards = function (f, bruteStart) {
    var colour = 0;
    var player = 0;
    var taking = 0;
    var winner = 0;
    var trickNu = 0;
    var cardCnt = 0;
    var value = 0;
    var remaining = 0;
    var perTrick = 0;
    var card = 0;
    var lead = 0;
    var best = 0;
    var bocks = rtl.arraySetLength(null,false,5,10);
    var cbock = rtl.arraySetLength(null,0,5);
    var where = rtl.arraySetLength(null,0,5);
    var guess = rtl.arraySetLength(null,0,5);
    var pulled = rtl.arraySetLength(null,0,5);
    var thrown = rtl.arraySetLength(null,0,5);
    var stack = {};
    var known = {};
    var wrong = {};
    var isBock = false;
    var isSure = false;
    var players = {};
    var c1st = 0;
    var c2nd = 0;
    var count = 0;
    var index = 0;
    var c = 0;
    var o = 0;
    var r = 0;
    var h = rtl.arraySetLength(null,0,12);
    function Remove(player, card, BREAKIfLast) {
      var other = 0;
      var found = false;
      if (player === f.fPlayer) return;
      other = f.fPMax;
      while ((other > 0) && ((other === player) || !(card in guess[other]))) other = other - 1;
      if (other !== 0) {
        guess[player] = rtl.diffSet(guess[player],rtl.createSet(card))}
       else if (!BREAKIfLast) {
        found = false;
        for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
          other = $l;
          if ((other !== player) && (card in where[other])) {
            found = true;
            guess[other] = rtl.unionSet(guess[other],rtl.createSet(card));
          };
        };
        if (found) guess[player] = rtl.diffSet(guess[player],rtl.createSet(card));
      };
    };
    function RemoveThrow(player, colour, rank, BREAKIfLast) {
      var value = 0;
      var r = 0;
      value = pas.DiffBase.gValueOfCard[f.fTrump][pas.fdcBase.gRankCard[f.fTrump][colour][rank]];
      r = rank + 1;
      while ((r < 9) && !bocks[colour][r]) {
        r = r + 1;
      };
      if ((r < 9) && (pas.fdcBase.gRankCard[f.fTrump][colour][r] in guess[player]) && (pas.DiffBase.gValueOfCard[f.fTrump][pas.fdcBase.gRankCard[f.fTrump][colour][r]] > value)) {
        Remove(player,pas.fdcBase.gRankCard[f.fTrump][colour][r],BREAKIfLast);
      };
      r = rank - 1;
      while ((r > 0) && !bocks[colour][r]) {
        r = r - 1;
      };
      if ((r > 0) && (pas.fdcBase.gRankCard[f.fTrump][colour][r] in guess[player]) && (pas.DiffBase.gValueOfCard[f.fTrump][pas.fdcBase.gRankCard[f.fTrump][colour][r]] > value)) {
        Remove(player,pas.fdcBase.gRankCard[f.fTrump][colour][r],BREAKIfLast);
      };
    };
    function InitReplay() {
      var player = 0;
      var colour = 0;
      var rank = 0;
      trickNu = -1;
      cardCnt = -1;
      remaining = 157;
      for (colour = 0; colour <= 4; colour++) {
        cbock[colour] = 9;
        for (rank = 0; rank <= 9; rank++) bocks[colour][rank] = true;
      };
      for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
        player = $l;
        if (player === f.fPlayer) {
          where[player] = rtl.refSet(f.fKnown[f.fPlayer])}
         else where[player] = rtl.diffSet(rtl.createSet(null,0 + 1,36),f.fKnown[f.fPlayer]);
        guess[player] = rtl.refSet(where[player]);
        pulled[player] = {};
        thrown[player] = {};
      };
      stack = {};
      known = rtl.refSet(f.fStack);
      for (var $l1 = f.fPMin, $end1 = f.fPMax; $l1 <= $end1; $l1++) {
        player = $l1;
        known = rtl.unionSet(known,f.fKnown[player]);
      };
    };
    function NextCard() {
      var Result = false;
      var p = 0;
      var i = 0;
      var r = 0;
      Result = false;
      cardCnt = (cardCnt + 1) % f.fNuPlayer;
      if (cardCnt === 0) {
        if (trickNu >= 0) {
          for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
            p = $l;
            card = f.fTricks[trickNu].fPlayed[p];
            colour = pas.DiffBase.gColourOf[card];
            bocks[colour][pas.fdcBase.gCardRank[f.fTrump][card]] = false;
            while ((cbock[colour] >= 1) && !bocks[colour][cbock[colour]]) cbock[colour] = cbock[colour] - 1;
          };
          remaining = remaining - pas.DiffBase.ValueOfTrick(f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[trickNu]));
        } else {
          return Result;
        };
        trickNu = trickNu + 1;
        lead = 0;
        best = 0;
        isBock = false;
        isSure = false;
        perTrick = rtl.trunc((remaining + rtl.trunc((9 - trickNu) / 2)) / (9 - trickNu));
        player = f.fTricks[trickNu].fLeading;
        winner = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
            return this.p.fPNext;
          }, set: function (v) {
            this.p.fPNext = v;
          }},f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[trickNu]));
        value = pas.DiffBase.ValueOfTrick(f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[trickNu]));
      } else {
        if (pas.DiffBase.gBetterCard[f.fTrump][best][card]) {
          best = card;
          taking = player;
          isBock = pas.fdcBase.gCardRank[f.fTrump][card] === cbock[colour];
          isSure = true;
          p = f.fPNext[player];
          while ((p !== f.fTricks[trickNu].fLeading) && (p !== player)) {
            isSure = isSure && rtl.eqSet(rtl.intersectSet(where[p],f.fCardsOf[f.fTrump]),{});
            p = f.fPNext[p];
          };
          isSure = (colour === f.fTrump) || isSure;
        };
        player = f.fPNext[player];
      };
      if ((trickNu >= f.fTrickNu) && ((player === 0) || (f.fTricks[trickNu].fPlayed[player] === 0))) {
        return Result;
      };
      card = f.fTricks[trickNu].fPlayed[player];
      for (var $l1 = f.fPMin, $end1 = f.fPMax; $l1 <= $end1; $l1++) {
        p = $l1;
        where[p] = rtl.diffSet(where[p],rtl.createSet(card));
        guess[p] = rtl.diffSet(guess[p],rtl.createSet(card));
      };
      stack = rtl.unionSet(stack,rtl.createSet(card));
      colour = pas.DiffBase.gColourOf[card];
      if (cardCnt === 0) {
        lead = card;
        if (pas.fdcBase.gCardRank[f.fTrump][card] !== cbock[colour]) pulled[player] = rtl.unionSet(pulled[player],rtl.createSet(colour));
      } else if ((colour !== pas.DiffBase.gColourOf[lead]) && (colour !== f.fTrump)) {
        thrown[player] = rtl.unionSet(thrown[player],rtl.createSet(colour));
        if (pas.DiffBase.gColourOf[lead] === f.fTrump) {
          where[player] = rtl.diffSet(where[player],rtl.diffSet(f.fCardsOf[pas.DiffBase.gColourOf[lead]],rtl.createSet(pas.DiffBase.gCardOf[f.fTrump][6])));
          guess[player] = rtl.diffSet(guess[player],rtl.diffSet(f.fCardsOf[pas.DiffBase.gColourOf[lead]],rtl.createSet(pas.DiffBase.gCardOf[f.fTrump][6])));
        } else {
          where[player] = rtl.diffSet(where[player],f.fCardsOf[pas.DiffBase.gColourOf[lead]]);
          guess[player] = rtl.diffSet(guess[player],f.fCardsOf[pas.DiffBase.gColourOf[lead]]);
        };
      };
      Result = true;
      return Result;
    };
    InitReplay();
    for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
      player = $l;
      guess[player] = rtl.unionSet(f.fKnown[player],rtl.intersectSet(guess[player],f.fWhere[player]));
    };
    while (NextCard()) {
      if ((player !== f.fPlayer) && (cardCnt > 0) && (colour !== pas.DiffBase.gColourOf[lead]) && (colour !== f.fTrump)) {
        RemoveThrow(player,colour,pas.fdcBase.gCardRank[f.fTrump][card],true);
      };
    };
    guess[f.fPlayer] = rtl.diffSet(f.fKnown[f.fPlayer],f.fStack);
    for (var $l1 = f.fPMin, $end1 = f.fPMax; $l1 <= $end1; $l1++) {
      player = $l1;
      if (player === f.fPlayer) {
        f.fGuess[player] = rtl.diffSet(f.fKnown[player],f.fStack)}
       else f.fGuess[player] = rtl.diffSet(rtl.unionSet(f.fKnown[player],rtl.intersectSet(guess[player],f.fWhere[player])),f.fStack);
    };
    if ($impl.gGuessCalls in $mod.gGuessOptions.flags) ;
    wrong = rtl.diffSet(rtl.createSet(null,0 + 1,36),f.fStack);
    for (var $l2 = f.fPMin, $end2 = f.fPMax; $l2 <= $end2; $l2++) {
      player = $l2;
      wrong = rtl.diffSet(wrong,f.fGuess[player]);
    };
    if (rtl.neSet(wrong,{})) {
      pas.DiffBase.CardSetToHand(rtl.refSet(wrong),{get: function () {
          return h;
        }, set: function (v) {
          h = v;
        }});
      for (var $l3 = 0, $end3 = f.fHandHigh; $l3 <= $end3; $l3++) {
        index = $l3;
        if (h[index] !== 0) {
          for (var $l4 = f.fPMin, $end4 = f.fPMax; $l4 <= $end4; $l4++) {
            player = $l4;
            if ((player !== f.fPlayer) && (h[index] in f.fWhere[player])) f.fGuess[player] = rtl.unionSet(f.fGuess[player],rtl.createSet(h[index]));
          };
        };
      };
    };
  };
  this.GetEstimateFor = function (f, colour, pmode, patt, leading, myTrumps, e) {
    var prank = 0;
    var ctype = 0;
    var count = 0;
    var ptabp = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,64);
    if (patt === 0) {
      pas.fdcBase.SetEstimate(e,0,0);
      return;
    };
    if (leading) {
      prank = pas.fdcBase.PLAYRANK.playFirst}
     else prank = pas.fdcBase.PLAYRANK.playOther;
    pas.fdcBase.GetIndexes(f.fTrump,colour,f.fNuCards[f.fTrump],myTrumps,f.fNuCards[colour],{get: function () {
        return ctype;
      }, set: function (v) {
        ctype = v;
      }},{get: function () {
        return count;
      }, set: function (v) {
        count = v;
      }});
    ptabp = pas.fdcBase.PatternTab$clone(pas.fdcBase.gfdcData.fPlayTab[f.fNuPlayer - 3][pmode].v[prank][ctype][count]);
    while ((patt > 0) && (ptabp[patt].played === 0)) patt = patt - 1;
    e.$assign(ptabp[patt]);
  };
  this.GetRemainingFor = function (f, player, tricks) {
    var Result = 0.0;
    var d = 0.0;
    var limit = 0;
    var count = 0;
    var rank = 0;
    var card = 0;
    var known = {};
    d = (f.fHandHigh + 1) - f.fTrickNu;
    if (d <= 0) {
      Result = 0;
      return Result;
    };
    limit = f.fRemaining;
    count = 0;
    if (player === f.fPlayer) {
      known = rtl.diffSet(f.fKnown[f.fPlayer],f.fStack);
      rank = 9;
      card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
      while ((rank > 0) && (!f.fBocks[f.fTrump][rank] || !(card in known))) {
        if (f.fBocks[f.fTrump][rank]) count = count + pas.DiffBase.gValueOfCard[f.fTrump][card];
        rank = rank - 1;
        card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
      };
      limit = limit - count;
      if (count <= 0) {
        rank = 9;
        card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
        while ((rank > 0) && (!f.fBocks[f.fTrump][rank] || (card in known))) {
          if (f.fBocks[f.fTrump][rank]) count = count + pas.DiffBase.gValueOfCard[f.fTrump][card];
          rank = rank - 1;
          card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
        };
        limit = limit - count;
      } else {
        count = 0;
      };
    };
    Result = count + ((limit * tricks) / d);
    return Result;
  };
  this.colEstimUnsure = 0.0;
  this.colEstimSure = 1.0;
  this.ColourPower = function (f, colour, patt) {
    var Result = 0.0;
    var base = 0;
    var estim = pas.fdcBase.ESTIMATE.$new();
    var ebase = pas.fdcBase.ESTIMATE.$new();
    Result = $mod.colEstimUnsure;
    if ((f.fNuCards[colour] <= 0) || (patt <= 0)) return Result;
    var $tmp = f.fNuCards[colour];
    if (($tmp === 1) || ($tmp === 2) || ($tmp === 3)) {
      base = 32}
     else if (($tmp === 4) || ($tmp === 5)) {
      base = 32 + 16}
     else {
      base = 32 + 16 + 8;
    };
    $impl.GetEstimateAloneFor(f,colour,pas.fdcBase.PLAYMODE.goForZero,base,f.fCardCnt === 0,ebase);
    $impl.GetEstimateAloneFor(f,colour,pas.fdcBase.PLAYMODE.goForMore,patt,f.fCardCnt === 0,estim);
    ebase.evalue = ebase.evalue / f.fNuCards[colour];
    estim.evalue = estim.evalue / pas.fdcBase.gNuCards[patt];
    if ((ebase.evalue <= 0) || (estim.evalue >= ebase.evalue)) {
      Result = $mod.colEstimSure}
     else Result = estim.evalue / ebase.evalue;
    return Result;
  };
  this.ColourSafety = function (f, colour, patt) {
    var Result = 0.0;
    var base = 0;
    var estim = pas.fdcBase.ESTIMATE.$new();
    var ebase = pas.fdcBase.ESTIMATE.$new();
    Result = $mod.colEstimSure;
    if ((f.fNuCards[colour] <= 0) || (patt <= 0)) return Result;
    var $tmp = f.fNuCards[colour];
    if ($tmp === 1) {
      Result = $mod.colEstimUnsure / 2.0;
      return Result;
    } else if ($tmp === 2) {
      base = 16}
     else if ($tmp === 3) {
      base = 16 + 8}
     else if ($tmp === 4) {
      base = 16 + 1}
     else if ($tmp === 5) {
      base = 8 + 1}
     else {
      base = 8 + 2;
    };
    $impl.GetEstimateAloneFor(f,colour,pas.fdcBase.PLAYMODE.goForMore,base,f.fCardCnt === 0,ebase);
    $impl.GetEstimateAloneFor(f,colour,pas.fdcBase.PLAYMODE.goForZero,patt,f.fCardCnt === 0,estim);
    ebase.evalue = ebase.evalue / f.fNuCards[colour];
    estim.evalue = estim.evalue / pas.fdcBase.gNuCards[patt];
    if ((estim.evalue <= 0) || (estim.evalue <= ebase.evalue)) {
      Result = $mod.colEstimSure}
     else Result = ebase.evalue / estim.evalue;
    return Result;
  };
  this.ColourControl = function (f, colour, patt) {
    var Result = 0.0;
    var loPatt = 0;
    var hiPatt = 0;
    var cards = {};
    var index = 0;
    Result = $mod.colEstimUnsure;
    if ((f.fNuCards[colour] <= 0) || (patt <= 0)) return Result;
    cards = {};
    for (var $l = 1, $end = rtl.trunc((pas.fdcBase.gNuCards[patt] + 1) / 2); $l <= $end; $l++) {
      index = $l;
      cards = rtl.unionSet(cards,rtl.createSet(pas.fdcBase.DoGetNthCard(f,colour,f.fPlayer,index)));
    };
    hiPatt = pas.fdcBase.DoGetPattern(f,f.fTrump,colour,rtl.refSet(cards));
    cards = {};
    for (var $l1 = rtl.trunc((pas.fdcBase.gNuCards[patt] + 1) / 2), $end1 = pas.fdcBase.gNuCards[patt]; $l1 <= $end1; $l1++) {
      index = $l1;
      cards = rtl.unionSet(cards,rtl.createSet(pas.fdcBase.DoGetNthCard(f,colour,f.fPlayer,index)));
    };
    loPatt = pas.fdcBase.DoGetPattern(f,f.fTrump,colour,rtl.refSet(cards));
    Result = ($mod.ColourPower(f,colour,hiPatt) + $mod.ColourSafety(f,colour,loPatt)) / 2;
    return Result;
  };
  this.InitfdcGuess = function () {
    pas.fdcBase.ClearOptions($mod.gGuessOptions);
    $impl.gGuessCalls = pas.fdcBase.DefineOption($mod.gGuessOptions,"calls");
    $impl.gGuessBocks = pas.fdcBase.DefineOption($mod.gGuessOptions,"bocks");
    $impl.gGuessOthers = pas.fdcBase.DefineOption($mod.gGuessOptions,"other");
    $mod.gGuessOptions.flags = rtl.unionSet($mod.gGuessOptions.flags,rtl.createSet($impl.gGuessCalls,$impl.gGuessBocks,$impl.gGuessOthers));
  };
  this.FreefdcGuess = function () {
  };
  $mod.$implcode = function () {
    $impl.gGuessCalls = 0;
    $impl.gGuessBocks = 0;
    $impl.gGuessOthers = 0;
    $impl.GetEstimateAloneFor = function (f, colour, pmode, patt, leading, e) {
      var prank = 0;
      var ctype = 0;
      var count = 0;
      var ptabp = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,64);
      if (patt === 0) {
        pas.fdcBase.SetEstimate(e,0,0);
        return;
      };
      if (leading) {
        prank = pas.fdcBase.PLAYRANK.playFirst}
       else prank = pas.fdcBase.PLAYRANK.playOther;
      if (colour === f.fTrump) {
        ctype = pas.fdcBase.CARDTYPE.cardTrump;
        count = f.fNuCards[colour];
      } else {
        ctype = pas.fdcBase.CARDTYPE.cardOther;
        count = f.fNuCards[colour];
      };
      ptabp = pas.fdcBase.PatternTab$clone(pas.fdcBase.gfdcData.fPlayTab[f.fNuPlayer - 3][pmode].v[prank][ctype][count]);
      while ((patt > 0) && (ptabp[patt].played === 0)) patt = patt - 1;
      e.$assign(ptabp[patt]);
    };
  };
},["StdUtils"]);
rtl.module("fdcCll",["System","DiffBase","DiffCmds","fdcBase"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"fdcCALL",function () {
    this.fTrump = 0;
    this.fEstim = 0.0;
    this.fVCall = 0.0;
    this.fLimit = 0.0;
    this.fFinal = 0;
    this.fPattVal$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = pas.fdcBase.ESTIMATE.$clone(a[c]);
      return b;
    };
    this.fPattLim$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) {
        var d = b[c] = [];
        d.length = 5;
        var e = a[c];
        for (var f = 0; f < 5; f++) d[f] = pas.fdcBase.ESTIMATE.$clone(e[f]);
      };
      return b;
    };
    this.fPattTot$a$clone = function (a) {
      var b = [];
      b.length = 2;
      for (var c = 0; c < 2; c++) b[c] = pas.fdcBase.ESTIMATE.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fPattern = rtl.arraySetLength(null,0,5);
      r.fPattVal = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,5);
      r.fPattLim = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,2,5);
      r.fPattSum = pas.fdcBase.ESTIMATE.$new();
      r.fPattTot = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,2);
      return r;
    };
    this.$eq = function (b) {
      return (this.fTrump === b.fTrump) && (this.fEstim === b.fEstim) && (this.fVCall === b.fVCall) && (this.fLimit === b.fLimit) && (this.fFinal === b.fFinal) && rtl.arrayEq(this.fPattern,b.fPattern) && rtl.arrayEq(this.fPattVal,b.fPattVal) && rtl.arrayEq(this.fPattLim,b.fPattLim) && this.fPattSum.$eq(b.fPattSum) && rtl.arrayEq(this.fPattTot,b.fPattTot);
    };
    this.$assign = function (s) {
      this.fTrump = s.fTrump;
      this.fEstim = s.fEstim;
      this.fVCall = s.fVCall;
      this.fLimit = s.fLimit;
      this.fFinal = s.fFinal;
      this.fPattern = s.fPattern.slice(0);
      this.fPattVal = this.fPattVal$a$clone(s.fPattVal);
      this.fPattLim = this.fPattLim$a$clone(s.fPattLim);
      this.fPattSum.$assign(s.fPattSum);
      this.fPattTot = this.fPattTot$a$clone(s.fPattTot);
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcCALL",{},this);
    $r.addField("fTrump",pas.DiffBase.$rtti["TTrump"]);
    $r.addField("fEstim",pas.System.$rtti["Single"]);
    $r.addField("fVCall",pas.System.$rtti["Single"]);
    $r.addField("fLimit",pas.System.$rtti["Single"]);
    $r.addField("fFinal",rtl.longint);
    $mod.$rtti.$StaticArray("fdcCALL.fPattern$a",{dims: [5], eltype: pas.fdcBase.$rtti["TPattern"]});
    $r.addField("fPattern",$mod.$rtti["fdcCALL.fPattern$a"]);
    $mod.$rtti.$StaticArray("fdcCALL.fPattVal$a",{dims: [5], eltype: pas.fdcBase.$rtti["ESTIMATE"]});
    $r.addField("fPattVal",$mod.$rtti["fdcCALL.fPattVal$a"]);
    $mod.$rtti.$StaticArray("fdcCALL.fPattLim$a",{dims: [2,5], eltype: pas.fdcBase.$rtti["ESTIMATE"]});
    $r.addField("fPattLim",$mod.$rtti["fdcCALL.fPattLim$a"]);
    $r.addField("fPattSum",pas.fdcBase.$rtti["ESTIMATE"]);
    $mod.$rtti.$StaticArray("fdcCALL.fPattTot$a",{dims: [2], eltype: pas.fdcBase.$rtti["ESTIMATE"]});
    $r.addField("fPattTot",$mod.$rtti["fdcCALL.fPattTot$a"]);
  });
  this.gCallOptions = pas.fdcBase.fdcOPTIONS.$new();
  this.gAdaptCall = 0;
  this.ClearfdcCall = function (Call) {
    var c = 0;
    var pmode = 0;
    Call.fTrump = 0;
    Call.fEstim = -10000;
    Call.fVCall = -10000;
    Call.fLimit = 12.0;
    Call.fFinal = -10000;
    for (c = 0; c <= 4; c++) {
      Call.fPattern[c] = 0;
      pas.fdcBase.SetEstimate(Call.fPattVal[c],0,0);
      for (pmode = 0; pmode <= 1; pmode++) {
        pas.fdcBase.SetEstimate(Call.fPattLim[pmode][c],0,0);
      };
    };
    pas.fdcBase.SetEstimate(Call.fPattSum,0,0);
    for (pmode = 0; pmode <= 1; pmode++) {
      pas.fdcBase.SetEstimate(Call.fPattTot[pmode],0,0);
    };
  };
  this.ChooseCall = function (f, Call) {
    var colour = 0;
    var hand = rtl.arraySetLength(null,0,12);
    var pmode = 0;
    var prank = 0;
    var input = "";
    var index = 0;
    var i = 0;
    var value = 0;
    var count = 0;
    var estim = pas.fdcBase.ESTIMATE.$new();
    var csofar = 0;
    var cdelta = 0;
    var player = 0;
    Call.fTrump = f.fTrump;
    pas.DiffBase.CardSetToHand(rtl.refSet(f.fKnown[f.fPlayer]),{get: function () {
        return hand;
      }, set: function (v) {
        hand = v;
      }});
    for (colour = 1; colour <= 4; colour++) {
      Call.fPattern[colour] = pas.fdcBase.DoGetPattern(f,f.fTrump,colour,rtl.refSet(f.fKnown[f.fPlayer]));
    };
    count = 9 - pas.fdcBase.gNuCards[Call.fPattern[f.fTrump]];
    if (f.fPNext[f.fInHand] === f.fPlayer) {
      prank = pas.fdcBase.PLAYRANK.playFirst}
     else prank = pas.fdcBase.PLAYRANK.playOther;
    Call.fEstim = 0;
    Call.fLimit = 0;
    for (colour = 1; colour <= 4; colour++) {
      if (colour === f.fTrump) {
        $impl.GetCallEstim(pas.fdcBase.gfdcData.fCallTab[f.fNuPlayer - 3],prank,pas.fdcBase.CARDTYPE.cardTrump,9,Call.fPattern[colour],Call.fPattVal[colour]);
      } else {
        $impl.GetCallEstim(pas.fdcBase.gfdcData.fCallTab[f.fNuPlayer - 3],prank,pas.fdcBase.CARDTYPE.cardTSupp,count,Call.fPattern[colour],Call.fPattVal[colour]);
      };
      pas.fdcBase.AddEstimate(Call.fPattSum,Call.fPattVal[colour]);
      for (pmode = 0; pmode <= 1; pmode++) {
        if (colour === f.fTrump) {
          Call.fPattLim[pmode][colour].$assign(pas.fdcBase.gfdcData.fPlayTab[f.fNuPlayer - 3][pmode].v[prank][pas.fdcBase.CARDTYPE.cardTrump][9][Call.fPattern[colour]]);
        } else {
          Call.fPattLim[pmode][colour].$assign(pas.fdcBase.gfdcData.fPlayTab[f.fNuPlayer - 3][pmode].v[prank][pas.fdcBase.CARDTYPE.cardTSupp][count][Call.fPattern[colour]]);
        };
        pas.fdcBase.AddEstimate(Call.fPattTot[pmode],Call.fPattLim[pmode][colour]);
      };
    };
    Call.fEstim = Call.fPattSum.evalue;
    Call.fLimit = 12.0;
    if ($impl.gFixedCall in $mod.gCallOptions.flags) {
      Call.fVCall = rtl.trunc(157 / f.fNuPlayer);
    } else if ($impl.gGoepfCall in $mod.gCallOptions.flags) {
      pas.DiffBase.CardSetToHand(rtl.refSet(f.fKnown[f.fPlayer]),{get: function () {
          return hand;
        }, set: function (v) {
          hand = v;
        }});
      Call.fVCall = 0;
      for (var $l = 0, $end = f.fHandHigh; $l <= $end; $l++) {
        i = $l;
        if (pas.DiffBase.gColourOf[hand[i]] === f.fTrump) {
          Call.fVCall = Call.fVCall + (pas.DiffBase.gValueOfCard[f.fTrump][hand[i]] * 2)}
         else if (pas.DiffBase.gRankOf[hand[i]] === 9) Call.fVCall = Call.fVCall + pas.DiffBase.gValueOfCard[f.fTrump][hand[i]];
      };
    } else {
      Call.fVCall = Call.fEstim;
    };
    if ((Call.fPattern[f.fTrump] >= 32) && (Call.fVCall < pas.DiffBase.gValueOfCard[f.fTrump][6])) {
      Call.fVCall = pas.DiffBase.gValueOfCard[f.fTrump][6];
    };
    if (($impl.gZeroedCall in $mod.gCallOptions.flags) && (Call.fVCall > 0) && (Call.fVCall <= Call.fLimit)) {
      Call.fVCall = 0;
    };
    if ((f.fCallMode === 2) && f.fCallBonus && (f.fPlayer === f.fInHand)) {
      player = f.fPNext[f.fPlayer];
      csofar = 0;
      while (player !== f.fPlayer) {
        csofar = csofar + f.fCalled[player];
        player = f.fPNext[player];
      };
      if ((csofar + Math.round(Call.fVCall)) < 157) {
        cdelta = 157 - (csofar + Math.round(Call.fVCall));
        cdelta = -((rtl.trunc(cdelta / 5) + 1) * 5);
      } else {
        cdelta = (csofar + Math.round(Call.fVCall)) - 157;
        cdelta = +((rtl.trunc(cdelta / 5) + 1) * 5);
      };
      Call.fVCall = (157 + cdelta) - csofar;
    };
    if (f.fLevel < 99) {
      if ((pas.DiffBase.Rnd(pas.fdcBase.gfdcRnd,true) % 2) === 1) {
        Call.fVCall = Call.fVCall + (((0.25 * (99 - f.fLevel)) / 99) * Call.fVCall);
      } else {
        Call.fVCall = Call.fVCall - (((0.25 * (99 - f.fLevel)) / 99) * Call.fVCall);
      };
    };
  };
  var points$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = pas.fdcBase.ESTIMATE.$clone(a[c]);
    return b;
  };
  this.EvaluateCall = function (f, Call) {
    var colour = 0;
    var player = 0;
    var trickv = 0;
    var index = 0;
    var tricks = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,5);
    var points = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,5);
    var estim = pas.fdcBase.ESTIMATE.$new();
    var ecomp = pas.fdcBase.ESTIMATE.$new();
    var prank = 0;
    var ctype = 0;
    var count = 0;
    if (rtl.eqSet(rtl.intersectSet(rtl.createSet($impl.gLearnCall,$mod.gAdaptCall,$impl.gAdaptLimit),pas.fdcBase.gLearnOptions.flags),{})) {
      return;
    };
    for (colour = 0; colour <= 4; colour++) {
      pas.fdcBase.SetEstimate(tricks[colour],0,1);
      pas.fdcBase.SetEstimate(points[colour],0,1);
    };
    for (var $l = f.fHandHigh; $l >= 0; $l--) {
      index = $l;
      colour = pas.DiffBase.gColourOf[f.fTricks[index].fPlayed[f.fPlayer]];
      trickv = pas.DiffBase.ValueOfTrick(f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[index]));
      if (index === f.fHandHigh) trickv = trickv + 5;
      if (pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[index])) === f.fPlayer) {
        pas.fdcBase.SetEstimate(estim,1,0);
        pas.fdcBase.AddEstimate(tricks[colour],estim);
        pas.fdcBase.SetEstimate(estim,trickv,0);
        pas.fdcBase.AddEstimate(points[colour],estim);
      };
    };
    if (f.fPlayer === f.fTricks[0].fLeading) {
      prank = pas.fdcBase.PLAYRANK.playFirst}
     else prank = pas.fdcBase.PLAYRANK.playOther;
    for (colour = 1; colour <= 4; colour++) {
      if (pas.fdcBase.gNuCards[Call.fPattern[colour]] > 0) {
        if (colour === f.fTrump) {
          ctype = pas.fdcBase.CARDTYPE.cardTrump;
          count = 9;
        } else {
          ctype = pas.fdcBase.CARDTYPE.cardTSupp;
          count = 9 - pas.fdcBase.gNuCards[Call.fPattern[f.fTrump]];
        };
        estim.$assign(pas.fdcBase.gfdcData.fCallTab[f.fNuPlayer - 3].v[prank][ctype][count][Call.fPattern[colour]]);
        if ($mod.gAdaptCall in pas.fdcBase.gLearnOptions.flags) {
          if (((Call.fFinal - Call.fEstim) > 0) && ((points[colour].evalue - Call.fPattVal[colour].evalue) > 0)) {
            pas.fdcBase.AdaptEstimate(estim,(Call.fFinal - Call.fEstim) / 100)}
           else if (((Call.fFinal - Call.fEstim) < 0) && ((points[colour].evalue - Call.fPattVal[colour].evalue) < 0)) pas.fdcBase.AdaptEstimate(estim,(Call.fFinal - Call.fEstim) / 100);
        } else if ($impl.gLearnCall in pas.fdcBase.gLearnOptions.flags) {
          pas.fdcBase.LearnEstimate(estim,points[colour]);
        };
        pas.fdcBase.gfdcData.fCallTab[f.fNuPlayer - 3].v[prank][ctype][count][Call.fPattern[colour]].$assign(estim);
      };
      if ($impl.gAdaptLimit in pas.fdcBase.gLearnOptions.flags) ;
    };
  };
  this.DoTableFixing = function (options) {
    var nuply = 0;
    var pmode = 0;
    var prank = 0;
    var ctype = 0;
    var count = 0;
    var index = 0;
    var ident = "";
    var estim = pas.fdcBase.ESTIMATE.$new();
    var global = false;
    var verbose = false;
    var pset = 0;
    var pfix = 0;
    var tab = null;
    var tzero = null;
    var tmore = null;
    function FixEstimate(phigh, plow, ehigh, elow) {
      if (verbose) {
        pas.fdcBase.WritePattern(pset);
        pas.DiffBase.LogWrite(" <- ");
        pas.fdcBase.WritePattern(pfix);
        pas.DiffBase.LogWrite(": ");
        pas.DiffBase.LogWrite(" := ");
        pas.DiffBase.LogWriteLn(".");
        ehigh.evalue = elow.evalue;
        if (elow.played < ehigh.played) ehigh.played = elow.played;
      };
    };
    function Possible() {
      var Result = false;
      Result = pas.fdcBase.gNuCards[pset] <= count;
      return Result;
    };
    if (pas.System.Pos("p3",options) > 0) {
      nuply = 3}
     else if (pas.System.Pos("p4",options) > 0) {
      nuply = 4}
     else return;
    verbose = pas.System.Pos("-v",options) <= 0;
    global = false;
    pmode = pas.fdcBase.PLAYMODE.goForZero;
    if (pas.System.Pos("=+",options) > 0) {
      global = true}
     else if (pas.System.Pos("+",options) > 0) {
      pmode = pas.fdcBase.PLAYMODE.goForMore}
     else if (pas.System.Pos("=",options) > 0) {
      pmode = pas.fdcBase.PLAYMODE.goForZero}
     else return;
    tab = pas.fdcBase.gfdcData.fPlayTab[nuply - 3][pmode];
    tzero = pas.fdcBase.gfdcData.fPlayTab[nuply - 3][pas.fdcBase.PLAYMODE.goForZero];
    tmore = pas.fdcBase.gfdcData.fPlayTab[nuply - 3][pas.fdcBase.PLAYMODE.goForMore];
    for (prank = 0; prank <= 1; prank++) {
      for (ctype = 0; ctype <= 2; ctype++) {
        for (pset = 0; pset <= 63; pset++) {
          pas.fdcBase.SetEstimate(tab.v[prank][ctype][0][pset],0,0);
          if (pset === 0) {
            for (count = 1; count <= 9; count++) pas.fdcBase.SetEstimate(tab.v[prank][ctype][count][pset],0,0);
          } else if (global) {
            for (count = 1; count <= 9; count++) {
              if (Possible()) {
                if ((tzero.v[prank][ctype][count][pset].played <= 0) && (tmore.v[prank][ctype][count][pset].played > 0)) {
                  if (verbose) pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(count,1).concat(": "));
                  tzero.v[prank][ctype][count][pset].$assign(tmore.v[prank][ctype][count][pset]);
                  tzero.v[prank][ctype][count][pset].played = tzero.v[prank][ctype][count][pset].played + 1;
                  if (verbose) {
                    pas.fdcBase.WritePattern(pset);
                    pas.DiffBase.LogWrite(": ");
                    pas.DiffBase.LogWrite(" <--");
                    pas.DiffBase.LogWriteLn(".");
                  };
                } else if ((tmore.v[prank][ctype][count][pset].played <= 0) && (tzero.v[prank][ctype][count][pset].played > 0)) {
                  if (verbose) pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(count,1).concat(": "));
                  tmore.v[prank][ctype][count][pset].$assign(tzero.v[prank][ctype][count][pset]);
                  tmore.v[prank][ctype][count][pset].played = tmore.v[prank][ctype][count][pset].played + 1;
                  if (verbose) {
                    pas.fdcBase.WritePattern(pset);
                    pas.DiffBase.LogWrite(": ");
                    pas.DiffBase.LogWrite(" <--");
                    pas.DiffBase.LogWriteLn(".");
                  };
                } else if (tzero.v[prank][ctype][count][pset].evalue > tmore.v[prank][ctype][count][pset].evalue) {
                  if (verbose) pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(count,1).concat(": "));
                  estim.$assign(tmore.v[prank][ctype][count][pset]);
                  tmore.v[prank][ctype][count][pset].$assign(tzero.v[prank][ctype][count][pset]);
                  tzero.v[prank][ctype][count][pset].$assign(estim);
                  tzero.v[prank][ctype][count][pset].played = tzero.v[prank][ctype][count][pset].played + 1;
                  tmore.v[prank][ctype][count][pset].played = tmore.v[prank][ctype][count][pset].played + 1;
                  if (verbose) {
                    pas.fdcBase.WritePattern(pset);
                    pas.DiffBase.LogWrite(": ");
                    pas.DiffBase.LogWrite(" <->");
                    pas.DiffBase.LogWriteLn(".");
                  };
                };
              };
            };
          } else {
            for (var $l = 0, $end = pset; $l <= $end; $l++) {
              pfix = $l;
              if ((pfix < pset) && (pas.fdcBase.gNuCards[pfix] === pas.fdcBase.gNuCards[pset])) {
                for (count = 1; count <= 9; count++) {
                  if (Possible() && (tab.v[prank][ctype][count][pfix].played >= 10) && (tab.v[prank][ctype][count][pset].evalue < tab.v[prank][ctype][count][pfix].evalue)) {
                    if (verbose) pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(count,1).concat(": "));
                    FixEstimate(pset,pfix,tab.v[prank][ctype][count][pset],tab.v[prank][ctype][count][pfix]);
                  };
                };
              };
            };
            for (var $l1 = pset - (pset % 8), $end1 = pset; $l1 <= $end1; $l1++) {
              pfix = $l1;
              for (count = 1; count <= 9; count++) {
                if (Possible() && (tab.v[prank][ctype][count][pfix].played >= 10) && (tab.v[prank][ctype][count][pset].evalue < tab.v[prank][ctype][count][pfix].evalue)) {
                  if (verbose) pas.DiffBase.LogWrite(pas.DiffBase.StringOfLong(count,1).concat(": "));
                  FixEstimate(pset,pfix,tab.v[prank][ctype][count][pset],tab.v[prank][ctype][count][pfix]);
                };
              };
            };
          };
        };
      };
    };
  };
  this.DoTableReset = function (options) {
    var tab = null;
    var patt = 0;
    var nuply = 0;
    var pmode = 0;
    var prank = 0;
    var ctype = 0;
    var count = 0;
    var limit = 0;
    var index = 0;
    var setup = false;
    if (pas.System.Pos("c3",options) > 0) {
      tab = pas.fdcBase.gfdcData.fCallTab[0]}
     else if (pas.System.Pos("c4",options) > 0) {
      tab = pas.fdcBase.gfdcData.fCallTab[1]}
     else {
      if (pas.System.Pos("p3",options) > 0) {
        nuply = 3}
       else if (pas.System.Pos("p4",options) > 0) {
        nuply = 4}
       else return;
      if (pas.System.Pos("+",options) > 0) {
        pmode = pas.fdcBase.PLAYMODE.goForMore}
       else if (pas.System.Pos("=",options) > 0) {
        pmode = pas.fdcBase.PLAYMODE.goForZero}
       else return;
      tab = pas.fdcBase.gfdcData.fPlayTab[nuply - 3][pmode];
    };
    index = pas.StdUtils.MaxL(pas.System.Pos("set",options),0);
    setup = index > 0;
    while (setup && (index <= options.length) && ((options.charAt(index - 1) < "0") || (options.charAt(index - 1) > "9"))) index = index + 1;
    if (!setup || (index > options.length)) {
      if (pas.System.Pos("min",options) > 0) {
        limit = 10}
       else limit = 10000 - 1;
    } else {
      limit = 0;
      while ((index <= options.length) && (options.charAt(index - 1) >= "0") && (options.charAt(index - 1) <= "9")) {
        limit = ((10 * limit) + options.charCodeAt(index - 1)) - 48;
        index = index + 1;
      };
    };
    if (limit < 10) {
      limit = 10}
     else if (limit >= 10000) limit = 10000 - 1;
    for (prank = 0; prank <= 1; prank++) {
      for (ctype = 0; ctype <= 2; ctype++) {
        for (count = 0; count <= 9; count++) {
          for (patt = 0; patt <= 63; patt++) {
            if ((setup && (tab.v[prank][ctype][count][patt].played > 10)) || (tab.v[prank][ctype][count][patt].played > limit)) tab.v[prank][ctype][count][patt].played = limit;
          };
        };
      };
    };
  };
  this.InitfdcCall = function () {
    $impl.gLearnCall = pas.fdcBase.DefineOption(pas.fdcBase.gLearnOptions,"call");
    $mod.gAdaptCall = pas.fdcBase.DefineOption(pas.fdcBase.gLearnOptions,"adapt_call");
    $impl.gAdaptLimit = pas.fdcBase.DefineOption(pas.fdcBase.gLearnOptions,"adapt_limit");
    pas.fdcBase.ClearOptions($mod.gCallOptions);
    $impl.gFixedCall = pas.fdcBase.DefineOption($mod.gCallOptions,"fixed");
    $impl.gGoepfCall = pas.fdcBase.DefineOption($mod.gCallOptions,"goepf");
    $impl.gZeroedCall = pas.fdcBase.DefineOption($mod.gCallOptions,"zeroing");
    $mod.gCallOptions.flags = rtl.createSet($impl.gZeroedCall);
  };
  this.FreefdcCall = function () {
  };
  $mod.$implcode = function () {
    $impl.gLearnCall = 0;
    $impl.gAdaptLimit = 0;
    $impl.gFixedCall = 0;
    $impl.gGoepfCall = 0;
    $impl.gZeroedCall = 0;
    $impl.GetCallEstim = function (tab, prank, ctype, count, patt, estim) {
      while ((patt > 0) && (tab.v[prank][ctype][count][patt].played <= 0)) patt = patt - 1;
      estim.$assign(tab.v[prank][ctype][count][patt]);
    };
  };
},["ResUtils","StdUtils"]);
rtl.module("fdcSrch",["System","DiffBase","fdcBase","fdcGuess"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"DATATRIPLE",function () {
    this.fVThis = 0.0;
    this.fVRest = 0.0;
    this.fTricks = 0.0;
    this.$eq = function (b) {
      return (this.fVThis === b.fVThis) && (this.fVRest === b.fVRest) && (this.fTricks === b.fTricks);
    };
    this.$assign = function (s) {
      this.fVThis = s.fVThis;
      this.fVRest = s.fVRest;
      this.fTricks = s.fTricks;
      return this;
    };
    var $r = $mod.$rtti.$Record("DATATRIPLE",{},this);
    $r.addField("fVThis",pas.System.$rtti["Single"]);
    $r.addField("fVRest",pas.System.$rtti["Single"]);
    $r.addField("fTricks",pas.System.$rtti["Single"]);
  });
  this.$rtti.$StaticArray("WONCOUNTER",{dims: [5], eltype: rtl.longint});
  rtl.recNewT(this,"SEARCHDATA",function () {
    this.fCard = 0;
    this.fDelta = 0.0;
    this.fPlayed = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fResult = $mod.DATATRIPLE.$new();
      r.fWonCnt = rtl.arraySetLength(null,0,5);
      return r;
    };
    this.$eq = function (b) {
      return (this.fCard === b.fCard) && (this.fDelta === b.fDelta) && this.fResult.$eq(b.fResult) && rtl.arrayEq(this.fWonCnt,b.fWonCnt) && (this.fPlayed === b.fPlayed);
    };
    this.$assign = function (s) {
      this.fCard = s.fCard;
      this.fDelta = s.fDelta;
      this.fResult.$assign(s.fResult);
      this.fWonCnt = s.fWonCnt.slice(0);
      this.fPlayed = s.fPlayed;
      return this;
    };
    var $r = $mod.$rtti.$Record("SEARCHDATA",{},this);
    $r.addField("fCard",pas.DiffBase.$rtti["TCard"]);
    $r.addField("fDelta",pas.System.$rtti["Single"]);
    $r.addField("fResult",$mod.$rtti["DATATRIPLE"]);
    $r.addField("fWonCnt",$mod.$rtti["WONCOUNTER"]);
    $r.addField("fPlayed",rtl.longint);
  });
  this.SEARCHINFO$clone = function (a) {
    var b = [];
    b.length = 12;
    for (var c = 0; c < 12; c++) b[c] = $mod.SEARCHDATA.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("SEARCHINFO",{dims: [12], eltype: this.$rtti["SEARCHDATA"]});
  this.gSearchOptions = pas.fdcBase.fdcOPTIONS.$new();
  this.ClearSearchInfo = function (info) {
    var index = 0;
    var p = 0;
    for (index = 0; index <= 11; index++) {
      info.get()[index].fCard = 0;
      info.get()[index].fDelta = 32000;
      info.get()[index].fResult.fVThis = 0;
      info.get()[index].fResult.fVRest = 0;
      info.get()[index].fResult.fTricks = 0;
      for (p = 0; p <= 4; p++) info.get()[index].fWonCnt[p] = 0;
      info.get()[index].fPlayed = 0;
    };
  };
  this.AdaptSearchInfo = function (info, card, delta, result, wonCnt, played) {
    var index = 0;
    var jndex = 0;
    index = 0;
    while ((info.get()[index].fCard !== 0) && (Math.abs(delta) >= Math.abs(info.get()[index].fDelta))) {
      index = index + 1;
    };
    jndex = 11;
    while (jndex > index) {
      info.get()[jndex].$assign(info.get()[jndex - 1]);
      jndex = jndex - 1;
    };
    info.get()[index].fCard = card;
    info.get()[index].fDelta = delta;
    info.get()[index].fResult.$assign(result);
    info.get()[index].fWonCnt = wonCnt.slice(0);
    info.get()[index].fPlayed = played;
  };
  var kNoPatt = 63;
  var kNoPVal = -1;
  this.TrickSearch = function (f, lookAt, pinfo, info) {
    var p = 0;
    var i = 0;
    var v = 0.0;
    var d = 0.0;
    var c = 0;
    var prev = 0;
    var colour = 0;
    var known = {};
    var trick = pas.DiffBase.TTrick.$new();
    var trickv = 0;
    var trickNu = 0;
    var cnext = rtl.arraySetLength(null,0,37);
    var pattern = rtl.arraySetLength(null,0,5);
    var pattval = rtl.arraySetLength(null,0.0,5);
    var nuWon = rtl.arraySetLength(null,0,5);
    var total = 0;
    var sdata = $mod.DATATRIPLE.$new();
    function PlayThis(p, c) {
      var colour = 0;
      colour = pas.DiffBase.gColourOf[c];
      trick.fPlayed[p] = c;
      f.fStack = rtl.unionSet(f.fStack,rtl.createSet(c));
      if (p === f.fPlayer) known = rtl.diffSet(known,rtl.createSet(c));
      f.fNuCards[colour] = f.fNuCards[colour] - 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][c]] = false;
      trickv = trickv + pas.DiffBase.gValueOfCard[f.fTrump][c];
      f.fRemaining = f.fRemaining - pas.DiffBase.gValueOfCard[f.fTrump][c];
      pattern[colour] = 63;
      if (colour === f.fTrump) {
        for (colour = 1; colour <= 4; colour++) pattval[colour] = -1;
      } else {
        pattval[colour] = -1;
      };
    };
    function UndoThis(p, c) {
      var colour = 0;
      colour = pas.DiffBase.gColourOf[c];
      trick.fPlayed[p] = 0;
      f.fStack = rtl.diffSet(f.fStack,rtl.createSet(c));
      if (p === f.fPlayer) known = rtl.unionSet(known,rtl.createSet(c));
      f.fNuCards[colour] = f.fNuCards[colour] + 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][c]] = true;
      trickv = trickv - pas.DiffBase.gValueOfCard[f.fTrump][c];
      f.fRemaining = f.fRemaining + pas.DiffBase.gValueOfCard[f.fTrump][c];
      pattern[colour] = 63;
      if (colour === f.fTrump) {
        for (colour = 1; colour <= 4; colour++) pattval[colour] = -1;
      } else {
        pattval[colour] = -1;
      };
    };
    function TrickExpect(toplay, winner, best, vthis, tricks) {
      var Result = 0.0;
      var colour = 0;
      var lead = 0;
      var player = 0;
      var nthis = 0.0;
      var ntricks = 0.0;
      var vrest = 0.0;
      var count = 0;
      var limit = 0;
      var index = 0;
      var tryIt = rtl.arraySetLength(null,0,27);
      var cards = {};
      var card = 0;
      var rank = 0;
      var cbest = rtl.arraySetLength(null,0,5);
      var cmedH = rtl.arraySetLength(null,0,5);
      var cmedL = rtl.arraySetLength(null,0,5);
      var clast = rtl.arraySetLength(null,0,5);
      var cmova = rtl.arraySetLength(null,0,5);
      var nuCards = rtl.arraySetLength(null,0,5);
      var pmode = 0;
      var prank = 0;
      var ctype = 0;
      var trumps = 0;
      var ptidx = 0;
      var won = false;
      var sure = false;
      var patt = 0;
      var next = 0;
      var ptabp = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,64);
      vthis.set(0);
      tricks.set(0);
      if ((toplay === trick.fLeading) && (trick.fPlayed[toplay] !== 0)) {
        if (trickNu === f.fTrickNu) {
          nuWon[winner] = nuWon[winner] + 1;
          total = total + 1;
        };
        trickNu = trickNu + 1;
        won = winner === f.fPlayer;
        if (won) {
          vthis.set(trickv);
        };
        for (colour = 1; colour <= 4; colour++) {
          if (pattern[colour] === 63) {
            patt = 0;
            next = 32;
            for (var $l = 9; $l >= 1; $l--) {
              rank = $l;
              if (f.fBocks[colour][rank]) {
                if (pas.fdcBase.gRankCard[f.fTrump][colour][rank] in known) {
                  if (next < 8) {
                    patt = patt + 1}
                   else patt = patt + next;
                };
                next = rtl.trunc(next / 2);
              };
            };
            pattern[colour] = patt;
          };
        };
        if ((f.fPtsSoFar[f.fPlayer] + vthis.get()) >= f.fCalled[f.fPlayer]) {
          pmode = pas.fdcBase.PLAYMODE.goForZero}
         else pmode = pas.fdcBase.PLAYMODE.goForMore;
        trumps = pas.fdcBase.gNuCards[pattern[f.fTrump]];
        count = f.fNuCards[f.fTrump];
        if (won) {
          prank = pas.fdcBase.PLAYRANK.playFirst}
         else prank = pas.fdcBase.PLAYRANK.playOther;
        tricks.set(0);
        for (colour = 1; colour <= 4; colour++) {
          if (pattval[colour] === -1) {
            pattval[colour] = 0;
            patt = pattern[colour];
            if (patt > 0) {
              if (colour === f.fTrump) {
                ctype = pas.fdcBase.CARDTYPE.cardTrump;
                ptidx = count;
              } else if ((count - trumps) <= 0) {
                ctype = pas.fdcBase.CARDTYPE.cardOther;
                ptidx = f.fNuCards[colour];
              } else {
                ctype = pas.fdcBase.CARDTYPE.cardTSupp;
                ptidx = count - trumps;
              };
              ptabp = pas.fdcBase.PatternTab$clone(pas.fdcBase.gfdcData.fPlayTab[f.fNuPlayer - 3][pmode].v[prank][ctype][ptidx]);
              while ((patt > 0) && (ptabp[patt].played === 0)) patt = patt - 1;
              pattval[colour] = ptabp[patt].evalue;
            };
          };
          tricks.set(tricks.get() + pattval[colour]);
        };
        limit = f.fRemaining;
        count = 0;
        if (pattern[f.fTrump] < 32) {
          rank = 9;
          card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
          while ((rank > 0) && (!f.fBocks[f.fTrump][rank] || !(card in known))) {
            if (f.fBocks[f.fTrump][rank]) limit = limit - pas.DiffBase.gValueOfCard[f.fTrump][card];
            rank = rank - 1;
            card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
          };
        } else {
          rank = 9;
          card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
          while ((rank > 0) && (!f.fBocks[f.fTrump][rank] || (card in known))) {
            if (f.fBocks[f.fTrump][rank]) count = count + pas.DiffBase.gValueOfCard[f.fTrump][card];
            rank = rank - 1;
            card = pas.fdcBase.gRankCard[f.fTrump][f.fTrump][rank];
          };
          limit = limit - count;
        };
        Result = count + ((limit * tricks.get()) / ((f.fHandHigh + 1) - trickNu));
        trickNu = trickNu - 1;
      } else {
        for (colour = 0; colour <= 4; colour++) {
          cbest[colour] = 0;
          cmedH[colour] = 0;
          cmedL[colour] = 0;
          clast[colour] = 0;
          cmova[colour] = 0;
          nuCards[colour] = 0;
        };
        cards = rtl.diffSet(f.fGuess[toplay],f.fStack);
        lead = pas.DiffBase.gColourOf[trick.fPlayed[trick.fLeading]];
        sure = rtl.neSet(rtl.diffSet(rtl.intersectSet(f.fKnown[toplay],f.fCardsOf[lead]),f.fStack),{});
        card = cnext[0];
        while (card !== 0) {
          colour = pas.DiffBase.gColourOf[card];
          if ((f.fNuCards[colour] > 0) && (card in cards)) {
            nuCards[colour] = nuCards[colour] + 1;
            if (pas.DiffBase.gBetterCard[f.fTrump][cbest[colour]][card]) {
              if (pas.DiffBase.gValueOfCard[f.fTrump][cbest[colour]] > pas.DiffBase.gValueOfCard[f.fTrump][cmova[colour]]) {
                cmova[colour] = cbest[colour];
              };
              cbest[colour] = card;
            };
            if ((clast[colour] === 0) || pas.DiffBase.gBetterCard[f.fTrump][card][clast[colour]]) {
              clast[colour] = card;
            };
            if (colour === lead) {
              if (pas.DiffBase.gBetterCard[f.fTrump][best][card] && ((cmedH[colour] === 0) || pas.DiffBase.gBetterCard[f.fTrump][card][cmedH[colour]])) {
                cmedH[colour] = card;
              };
              if (pas.DiffBase.gBetterCard[f.fTrump][card][best] && ((cmedL[colour] === 0) || pas.DiffBase.gBetterCard[f.fTrump][cmedL[colour]][card])) {
                cmedL[colour] = card;
              };
            };
            if ((card !== cbest[colour]) && (pas.DiffBase.gValueOfCard[f.fTrump][card] > pas.DiffBase.gValueOfCard[f.fTrump][cmova[colour]])) {
              cmova[colour] = card;
            };
          };
          card = cnext[card];
        };
        limit = 1;
        if (!sure && (nuCards[lead] > 0)) {
          player = f.fPNext[trick.fLeading];
          while ((player !== toplay) && (pas.DiffBase.gColourOf[trick.fPlayed[player]] !== lead)) player = f.fPNext[player];
          if (player === toplay) {
            player = f.fPNext[player];
            while ((player !== trick.fLeading) && rtl.eqSet(rtl.intersectSet(rtl.diffSet(f.fGuess[player],f.fStack),f.fCardsOf[lead]),{})) player = f.fPNext[player];
          };
          sure = player === trick.fLeading;
          if (!sure) {
            if (pas.DiffBase.gColourOf[trick.fPlayed[f.fPlayer]] === lead) {
              count = (f.fNuCards[lead] - pas.fdcBase.gNuCards[pinfo.fPattern[lead]]) + 1}
             else count = f.fNuCards[lead] - pas.fdcBase.gNuCards[pinfo.fPattern[lead]];
            if ((winner === f.fPlayer) && (count <= 3)) limit = nuCards[lead];
          };
        };
        count = 0;
        for (colour = 1; colour <= 4; colour++) {
          if ((colour === lead) || (colour === f.fTrump) || (!sure && (nuCards[lead] <= limit))) {
            if (cbest[colour] !== 0) {
              tryIt[count] = cbest[colour];
              count = count + 1;
            };
            if ((cmedH[colour] !== 0) && (cmedH[colour] !== cbest[colour])) {
              tryIt[count] = cmedH[colour];
              count = count + 1;
            };
            if ((cmedL[colour] !== 0) && (cmedL[colour] !== cbest[colour]) && (cmedL[colour] !== cmedH[colour])) {
              tryIt[count] = cmedL[colour];
              count = count + 1;
            };
            if ((clast[colour] !== 0) && (clast[colour] !== cbest[colour]) && (clast[colour] !== cmedH[colour]) && (clast[colour] !== cmedL[colour])) {
              tryIt[count] = clast[colour];
              count = count + 1;
            };
            if ((cmova[colour] !== 0) && (cmova[colour] !== cbest[colour]) && (cmova[colour] !== cmedH[colour]) && (cmova[colour] !== cmedL[colour]) && (cmova[colour] !== clast[colour])) {
              tryIt[count] = cmova[colour];
              count = count + 1;
            };
          };
        };
        vrest = 0;
        for (var $l1 = 0, $end = count - 1; $l1 <= $end; $l1++) {
          index = $l1;
          card = tryIt[index];
          PlayThis(toplay,card);
          if (pas.DiffBase.gBetterCard[f.fTrump][best][card]) {
            vrest = vrest + TrickExpect(f.fPNext[toplay],toplay,card,{get: function () {
                return nthis;
              }, set: function (v) {
                nthis = v;
              }},{get: function () {
                return ntricks;
              }, set: function (v) {
                ntricks = v;
              }})}
           else vrest = vrest + TrickExpect(f.fPNext[toplay],winner,best,{get: function () {
              return nthis;
            }, set: function (v) {
              nthis = v;
            }},{get: function () {
              return ntricks;
            }, set: function (v) {
              ntricks = v;
            }});
          vthis.set(vthis.get() + nthis);
          tricks.set(tricks.get() + ntricks);
          UndoThis(toplay,card);
        };
        count = pas.StdUtils.MaxL(1,count);
        vthis.set(vthis.get() / count);
        Result = vrest / count;
        tricks.set(tricks.get() / count);
      };
      return Result;
    };
    trick.$assign(f.fTricks[f.fTrickNu]);
    if (trick.fLeading === 0) trick.fLeading = f.fPlayer;
    trickv = pas.DiffBase.ValueOfTrick(f.fTrump,pas.DiffBase.TTrick.$clone(trick));
    trickNu = f.fTrickNu;
    for (c = 1; c <= 36; c++) cnext[c] = 0;
    prev = 0;
    for (c = 1; c <= 36; c++) {
      if (!(c in f.fStack)) {
        cnext[prev] = c;
        prev = c;
      };
    };
    known = rtl.diffSet(f.fKnown[f.fPlayer],f.fStack);
    p = trick.fLeading;
    while (p !== f.fPlayer) {
      c = trick.fPlayed[p];
      colour = pas.DiffBase.gColourOf[c];
      f.fNuCards[colour] = f.fNuCards[colour] - 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][c]] = false;
      p = f.fPNext[p];
    };
    $mod.ClearSearchInfo(info);
    for (c = 1; c <= 36; c++) {
      if (c in lookAt) {
        for (colour = 0; colour <= 4; colour++) {
          pattern[colour] = 63;
          pattval[colour] = -1;
        };
        for (p = 0; p <= 4; p++) nuWon[p] = 0;
        total = 0;
        PlayThis(f.fPlayer,c);
        p = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
            return this.p.fPNext;
          }, set: function (v) {
            this.p.fPNext = v;
          }},f.fTrump,pas.DiffBase.TTrick.$clone(trick));
        sdata.fVRest = TrickExpect(f.fPNext[f.fPlayer],p,trick.fPlayed[p],{p: sdata, get: function () {
            return this.p.fVThis;
          }, set: function (v) {
            this.p.fVThis = v;
          }},{p: sdata, get: function () {
            return this.p.fTricks;
          }, set: function (v) {
            this.p.fTricks = v;
          }});
        if (f.fLevel < 99) {
          if ((pas.DiffBase.Rnd(pas.fdcBase.gfdcRnd,true) % 2) === 1) {
            sdata.fVThis = sdata.fVThis + (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVThis);
            sdata.fVRest = sdata.fVRest - (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVRest);
          } else {
            sdata.fVThis = sdata.fVThis - (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVThis);
            sdata.fVRest = sdata.fVRest + (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVRest);
          };
        };
        v = sdata.fVThis + sdata.fVRest;
        d = v + (f.fPtsSoFar[f.fPlayer] - f.fCalled[f.fPlayer]);
        $mod.AdaptSearchInfo(info,c,d,$mod.DATATRIPLE.$clone(sdata),nuWon.slice(0),total);
        UndoThis(f.fPlayer,c);
      };
    };
    p = trick.fLeading;
    while (p !== f.fPlayer) {
      c = trick.fPlayed[p];
      colour = pas.DiffBase.gColourOf[c];
      f.fNuCards[colour] = f.fNuCards[colour] + 1;
      f.fBocks[colour][pas.fdcBase.gCardRank[f.fTrump][c]] = true;
      p = f.fPNext[p];
    };
  };
  var maxDistributions = 100;
  var where$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
    return b;
  };
  var pnext$a$clone = function (a) {
    var b = [];
    b.length = 27;
    for (var c = 0; c < 27; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.BruteSearch = function (f, pinfo, info) {
    var player = 0;
    var winner = 0;
    var colour = 0;
    var lead = 0;
    var value = 0.0;
    var trick = pas.DiffBase.TTrick.$new();
    var legal = rtl.arraySetLength(null,0,12);
    var card = 0;
    var best = 0;
    var rank = 0;
    var nuWon = rtl.arraySetLength(null,0,5);
    var sdata = $mod.DATATRIPLE.$new();
    var nowhere = 0;
    var linkTo = 0;
    var avoid = {};
    var cards = rtl.arraySetLength(null,0,27);
    var where = rtl.arraySetLength(null,0,5);
    var place = rtl.arraySetLength(null,0,27);
    var prior = rtl.arraySetLength(null,0,27);
    var pnext = rtl.arraySetLength(null,0,27,5);
    var hands = rtl.arraySetLength(null,0,5,12);
    var nuCards = rtl.arraySetLength(null,0,5);
    var nuFree = rtl.arraySetLength(null,0,5);
    var stack = 0;
    var index = 0;
    var retry = 0;
    var dscnt = 0;
    var dsfrq = 0;
    var dstry = 0;
    var priot = 0;
    var mtsum = rtl.arraySetLength(null,0.0,12);
    var allDistributions = false;
    var countDistributions = false;
    var reduced = false;
    var remaining = 0;
    var trickv = 0;
    var called = rtl.arraySetLength(null,0,5);
    var points = rtl.arraySetLength(null,0,5);
    var trump = 0;
    var trumpKnave = 0;
    var mainIndex = 0;
    var cardHigh = 0;
    var win1st = rtl.arraySetLength(null,0,12);
    var played = rtl.arraySetLength(null,0,12);
    var rnk1 = 0;
    var rnk2 = 0;
    var count = 0;
    var previ = 0;
    var isSure = false;
    var needPoints = false;
    function RemoveCard(at) {
      var player = 0;
      var index = 0;
      var card = 0;
      player = place[at];
      if (player !== nowhere) {
        nuFree[player] = nuFree[player] + 1;
        card = cards[at];
        index = nuCards[player] - 1;
        while (hands[player][index] !== card) index = index - 1;
        while (index > 0) {
          hands[player][index] = hands[player][index - 1];
          index = index - 1;
        };
        place[at] = nowhere;
      };
    };
    function Expectation(leader, winner, toplay, lead, best, trick, depth) {
      var Result = 0.0;
      var value = 0.0;
      var estim = 0.0;
      var count = 0;
      var index = 0;
      var card = 0;
      var legal = rtl.arraySetLength(null,0,12);
      var phand = 0;
      var rank = 0;
      var none = false;
      var noTrumps = false;
      if (f.fTrickNu >= f.fHandHigh) {
        do {
          phand = toplay;
          index = 0;
          while (hands[phand][index] === 0) index = index + 1;
          if (pas.DiffBase.gBetterCard[trump][best][hands[phand][index]]) {
            best = hands[phand][index];
            winner = toplay;
          };
          toplay = f.fPNext[toplay];
        } while (!(toplay === leader));
        if (winner === f.fPlayer) {
          Result = Math.abs((points[f.fPlayer] - called[f.fPlayer]) + remaining)}
         else Result = Math.abs(points[f.fPlayer] - called[f.fPlayer]);
      } else if ((toplay === leader) && (best !== 0)) {
        if (depth === 0) {
          played[mainIndex] = played[mainIndex] + 1;
          if (winner === f.fPlayer) win1st[mainIndex] = win1st[mainIndex] + 1;
        };
        remaining = remaining - trick;
        points[winner] = points[winner] + trick;
        f.fTrickNu = f.fTrickNu + 1;
        Result = Expectation(winner,0,winner,0,0,0,depth + 1);
        f.fTrickNu = f.fTrickNu - 1;
        points[winner] = points[winner] - trick;
        remaining = remaining + trick;
      } else {
        phand = toplay;
        legal = hands[phand].slice(0);
        if (toplay !== leader) {
          none = true;
          if (trump === lead) {
            for (var $l = 0, $end = cardHigh; $l <= $end; $l++) {
              index = $l;
              if (pas.DiffBase.gColourOf[legal[index]] === trump) {
                none = none && (trumpKnave === legal[index])}
               else legal[index] = 0;
            };
          } else {
            noTrumps = true;
            if (pas.DiffBase.gColourOf[best] !== trump) {
              for (var $l1 = 0, $end1 = cardHigh; $l1 <= $end1; $l1++) {
                index = $l1;
                if (pas.DiffBase.gColourOf[legal[index]] === lead) {
                  none = false}
                 else if (pas.DiffBase.gColourOf[legal[index]] !== trump) {
                  legal[index] = 0}
                 else if (noTrumps) noTrumps = legal[index] === trumpKnave;
              };
            } else {
              rank = pas.fdcBase.gCardRank[trump][best];
              for (var $l2 = 0, $end2 = cardHigh; $l2 <= $end2; $l2++) {
                index = $l2;
                if (pas.DiffBase.gColourOf[legal[index]] === lead) {
                  none = false}
                 else if ((pas.DiffBase.gColourOf[legal[index]] !== trump) || (pas.fdcBase.gCardRank[trump][legal[index]] < rank)) {
                  legal[index] = 0}
                 else if (noTrumps) noTrumps = legal[index] === trumpKnave;
              };
            };
            if (none) {
              for (var $l3 = 0, $end3 = cardHigh; $l3 <= $end3; $l3++) {
                index = $l3;
                if ((hands[phand][index] !== 0) && (pas.DiffBase.gColourOf[hands[phand][index]] !== trump)) {
                  legal[index] = hands[phand][index];
                  none = false;
                };
              };
              none = none && noTrumps;
            };
          };
          if (none) legal = hands[phand].slice(0);
        };
        if (toplay === f.fPlayer) {
          estim = 32000;
          index = 0;
          while (index <= cardHigh) {
            card = legal[index];
            if (card !== 0) {
              if (toplay === leader) lead = pas.DiffBase.gColourOf[card];
              hands[phand][index] = 0;
              if (pas.DiffBase.gBetterCard[trump][best][card]) {
                value = Expectation(leader,toplay,f.fPNext[toplay],lead,card,trick + pas.DiffBase.gValueOfCard[trump][card],depth)}
               else value = Expectation(leader,winner,f.fPNext[toplay],lead,best,trick + pas.DiffBase.gValueOfCard[trump][card],depth);
              if (value < estim) estim = value;
              hands[phand][index] = card;
            };
            index = index + 1;
          };
          Result = estim;
        } else {
          estim = 0;
          count = 0;
          index = 0;
          while (index <= cardHigh) {
            card = legal[index];
            if (card !== 0) {
              if (toplay === leader) lead = pas.DiffBase.gColourOf[card];
              hands[phand][index] = 0;
              if (pas.DiffBase.gBetterCard[trump][best][card]) {
                estim = estim + Expectation(leader,toplay,f.fPNext[toplay],lead,card,trick + pas.DiffBase.gValueOfCard[trump][card],depth)}
               else estim = estim + Expectation(leader,winner,f.fPNext[toplay],lead,best,trick + pas.DiffBase.gValueOfCard[trump][card],depth);
              hands[phand][index] = card;
              count = count + 1;
            };
            index = index + 1;
          };
          Result = estim / pas.StdUtils.MaxL(1,count);
        };
      };
      return Result;
    };
    $mod.ClearSearchInfo(info);
    trick.$assign(f.fTricks[f.fTrickNu]);
    if (trick.fLeading === 0) trick.fLeading = f.fPlayer;
    nowhere = f.fPlayer;
    trump = f.fTrump;
    trumpKnave = pas.DiffBase.gCardOf[trump][6];
    reduced = ((f.fTrickNu * f.fNuPlayer) + f.fCardCnt) < 26;
    player = trick.fLeading;
    while (player !== f.fPlayer) {
      nuCards[player] = (f.fHandHigh + 1) - f.fTrickNu - 1;
      player = f.fPNext[player];
    };
    do {
      nuCards[player] = (f.fHandHigh + 1) - f.fTrickNu;
      player = f.fPNext[player];
    } while (!(player === trick.fLeading));
    cardHigh = (f.fHandHigh + 1) - f.fTrickNu - 1;
    for (var $l = f.fPMin, $end = f.fPMax; $l <= $end; $l++) {
      player = $l;
      nuFree[player] = nuCards[player];
      for (index = 0; index <= 11; index++) hands[player][index] = 0;
    };
    pas.DiffBase.CardSetToHand(rtl.diffSet(pinfo.fCards,f.fStack),{a: f.fPlayer, p: hands, get: function () {
        return this.p[this.a];
      }, set: function (v) {
        this.p[this.a] = v;
      }});
    pas.DiffBase.LegalHand(f.fTrump,pas.DiffBase.TTrick.$clone(trick),hands[f.fPlayer].slice(0),{get: function () {
        return legal;
      }, set: function (v) {
        legal = v;
      }});
    if (trick.fLeading !== f.fPlayer) {
      needPoints = f.fPtsSoFar[f.fPlayer] < f.fCalled[f.fPlayer];
      winner = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(trick));
      card = trick.fPlayed[winner];
      player = f.fPlayer;
      while (player !== trick.fLeading) {
        if (player !== f.fPlayer) pas.DiffBase.CardSetToHand(rtl.refSet(f.fGuess[player]),{a: player, p: hands, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
        index = 0;
        while ((index <= f.fHandHigh) && !pas.DiffBase.gBetterCard[f.fTrump][card][hands[player][index]]) index = index + 1;
        if (player !== f.fPlayer) pas.DiffBase.CardSetToHand({},{a: player, p: hands, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
        if (index <= f.fHandHigh) break;
        player = f.fPNext[player];
      };
      isSure = player === trick.fLeading;
      colour = pas.DiffBase.gColourOf[trick.fPlayed[trick.fLeading]];
      player = trick.fLeading;
      while (player !== f.fPlayer) {
        card = trick.fPlayed[player];
        if (pas.DiffBase.gColourOf[card] !== colour) f.fBocks[pas.DiffBase.gColourOf[card]][pas.fdcBase.gCardRank[f.fTrump][card]] = false;
        player = f.fPNext[player];
      };
      previ = 0;
      while (previ <= f.fHandHigh) {
        index = previ + 1;
        while ((legal[previ] !== 0) && (index <= f.fHandHigh)) {
          card = legal[previ];
          if ((legal[index] !== 0) && (pas.DiffBase.gColourOf[legal[index]] === pas.DiffBase.gColourOf[card])) {
            rnk1 = pas.fdcBase.gCardRank[f.fTrump][card];
            rnk2 = pas.fdcBase.gCardRank[f.fTrump][legal[index]];
            if (rnk1 > rnk2) {
              rnk1 = rnk2;
              rnk2 = pas.fdcBase.gCardRank[f.fTrump][card];
            };
            rnk1 = rnk1 + 1;
            while ((rnk1 < rnk2) && (!f.fBocks[pas.DiffBase.gColourOf[card]][rnk1] || (pas.fdcBase.gRankCard[f.fTrump][pas.DiffBase.gColourOf[card]][rnk1] in f.fKnown[f.fPlayer]))) rnk1 = rnk1 + 1;
            if ((rnk1 === rnk2) && (isSure || (pas.DiffBase.gValueOfCard[f.fTrump][card] === pas.DiffBase.gValueOfCard[f.fTrump][legal[index]]))) {
              if (needPoints) {
                if (winner === f.fPlayer) {
                  if (pas.DiffBase.gValueOfCard[f.fTrump][card] >= pas.DiffBase.gValueOfCard[f.fTrump][legal[index]]) {
                    legal[index] = 0}
                   else legal[previ] = 0;
                } else {
                  if (pas.DiffBase.gValueOfCard[f.fTrump][card] <= pas.DiffBase.gValueOfCard[f.fTrump][legal[index]]) {
                    legal[index] = 0}
                   else legal[previ] = 0;
                };
              } else {
                if (winner === f.fPlayer) {
                  if (pas.DiffBase.gValueOfCard[f.fTrump][card] <= pas.DiffBase.gValueOfCard[f.fTrump][legal[index]]) {
                    legal[index] = 0}
                   else legal[previ] = 0;
                } else {
                  if (pas.DiffBase.gValueOfCard[f.fTrump][card] >= pas.DiffBase.gValueOfCard[f.fTrump][legal[index]]) {
                    legal[index] = 0}
                   else legal[previ] = 0;
                };
              };
            };
          };
          index = index + 1;
        };
        previ = previ + 1;
      };
      player = trick.fLeading;
      while (player !== f.fPlayer) {
        card = trick.fPlayed[player];
        if (pas.DiffBase.gColourOf[card] !== colour) f.fBocks[pas.DiffBase.gColourOf[card]][pas.fdcBase.gCardRank[f.fTrump][card]] = true;
        player = f.fPNext[player];
      };
      count = 0;
      for (var $l1 = 0, $end1 = f.fHandHigh; $l1 <= $end1; $l1++) {
        index = $l1;
        if (legal[index] !== 0) {
          info.get()[0].fCard = legal[index];
          count = count + 1;
        };
      };
      if (count !== 1) {
        info.get()[0].fCard = 0}
       else {
        return;
      };
    };
    avoid = rtl.unionSet(f.fStack,f.fGuess[f.fPlayer]);
    for (var $l2 = f.fPMin, $end2 = f.fPMax; $l2 <= $end2; $l2++) {
      player = $l2;
      avoid = rtl.unionSet(avoid,rtl.createSet(trick.fPlayed[player]));
      where[player] = rtl.diffSet(rtl.unionSet(f.fKnown[player],f.fWhere[player]),f.fStack);
    };
    mainIndex = 0;
    for (card = 1; card <= 36; card++) {
      if (!(card in avoid)) {
        priot = 0;
        player = nowhere;
        do {
          if (card in f.fGuess[player]) priot = priot + 10;
          if (card in where[player]) priot = priot + 1;
          player = f.fPNext[player];
        } while (!(player === nowhere));
        index = 0;
        while ((index < mainIndex) && (prior[index] <= priot)) index = index + 1;
        for (var $l3 = mainIndex - 1, $end3 = index; $l3 >= $end3; $l3--) {
          stack = $l3;
          cards[stack + 1] = cards[stack];
          prior[stack + 1] = prior[stack];
        };
        cards[index] = card;
        prior[index] = priot;
        place[mainIndex] = nowhere;
        mainIndex = mainIndex + 1;
      };
    };
    while (mainIndex <= 26) {
      cards[mainIndex] = 0;
      place[mainIndex] = 0;
      mainIndex = mainIndex + 1;
    };
    index = 0;
    while (cards[index] !== 0) {
      for (var $l4 = f.fPMin, $end4 = f.fPMax; $l4 <= $end4; $l4++) {
        player = $l4;
        pnext[index][player] = nowhere;
      };
      card = cards[index];
      player = nowhere;
      linkTo = nowhere;
      do {
        linkTo = f.fPNext[linkTo];
        if ((linkTo === nowhere) || (card in f.fGuess[linkTo])) {
          pnext[index][player] = linkTo;
          player = linkTo;
        };
      } while (!(linkTo === nowhere));
      index = index + 1;
    };
    lead = pas.DiffBase.gColourOf[trick.fPlayed[trick.fLeading]];
    winner = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
        return this.p.fPNext;
      }, set: function (v) {
        this.p.fPNext = v;
      }},trump,pas.DiffBase.TTrick.$clone(trick));
    if (trick.fLeading === f.fPlayer) {
      best = 0}
     else best = trick.fPlayed[winner];
    trickv = pas.DiffBase.ValueOfTrick(trump,pas.DiffBase.TTrick.$clone(trick));
    remaining = f.fRemaining;
    for (player = 0; player <= 4; player++) {
      called[player] = f.fCalled[player];
      points[player] = f.fPtsSoFar[player];
    };
    for (index = 0; index <= 11; index++) {
      mtsum[index] = 0;
      win1st[index] = 0;
      played[index] = 0;
    };
    countDistributions = reduced;
    retry = 1;
    dsfrq = 1;
    dscnt = 0;
    dstry = 0;
    do {
      allDistributions = false;
      stack = 1;
      do {
        stack = stack - 1;
        while (cards[stack] !== 0) {
          do {
            player = place[stack];
            RemoveCard(stack);
            do {
              player = pnext[stack][player];
            } while (!((player === nowhere) || (nuFree[player] > 0)));
            if (player === nowhere) {
              index = stack;
              while (cards[index] !== 0) {
                RemoveCard(index);
                index = index + 1;
              };
              stack = stack - 1;
              allDistributions = stack < 0;
            };
          } while (!((player !== nowhere) || allDistributions));
          if (allDistributions) break;
          nuFree[player] = nuFree[player] - 1;
          hands[player][nuFree[player]] = cards[stack];
          place[stack] = player;
          stack = stack + 1;
        };
        dscnt = dscnt + 1;
        if (!countDistributions && !allDistributions && (!reduced || ((dscnt % dsfrq) === 0))) {
          for (var $l5 = 0, $end5 = f.fHandHigh; $l5 <= $end5; $l5++) {
            mainIndex = $l5;
            card = legal[mainIndex];
            if (card !== 0) {
              hands[f.fPlayer][mainIndex] = 0;
              trick.fPlayed[f.fPlayer] = card;
              if (f.fPlayer === trick.fLeading) lead = pas.DiffBase.gColourOf[card];
              if (pas.DiffBase.gBetterCard[trump][best][card]) {
                value = Expectation(trick.fLeading,f.fPlayer,f.fPNext[f.fPlayer],lead,card,trickv + pas.DiffBase.gValueOfCard[trump][card],0)}
               else value = Expectation(trick.fLeading,winner,f.fPNext[f.fPlayer],lead,best,trickv + pas.DiffBase.gValueOfCard[trump][card],0);
              mtsum[mainIndex] = mtsum[mainIndex] + value;
              trick.fPlayed[f.fPlayer] = 0;
              hands[f.fPlayer][mainIndex] = card;
            };
          };
          dstry = dstry + 1;
        };
      } while (!allDistributions);
      dscnt = dscnt - 1;
      if (dscnt <= 0) {
        dscnt = 0;
        retry = retry - 1;
        if (retry < 0) {
          pas.DiffBase.LogWriteLn(" where inconsistency ...")}
         else if (retry === 0) {
          if (false) pas.DiffBase.LogWriteLn(" guess inconsistency ...");
          index = 0;
          while (cards[index] !== 0) {
            card = cards[index];
            player = nowhere;
            linkTo = nowhere;
            do {
              linkTo = f.fPNext[linkTo];
              if ((linkTo === nowhere) || (card in where[linkTo])) {
                pnext[index][player] = linkTo;
                player = linkTo;
              };
            } while (!(linkTo === nowhere));
            index = index + 1;
          };
          if (reduced && !countDistributions) retry = -1;
        };
      } else if (countDistributions) {
        if (dscnt >= 100) {
          dsfrq = rtl.trunc((dscnt + rtl.trunc(100 / 2)) / 100)}
         else dsfrq = 1;
        dscnt = 0;
        countDistributions = false;
      };
    } while (!((dscnt > 0) || (retry < 0)));
    if (dscnt <= 0) return;
    for (var $l6 = 0, $end6 = f.fHandHigh; $l6 <= $end6; $l6++) {
      mainIndex = $l6;
      card = legal[mainIndex];
      if (card !== 0) {
        value = mtsum[mainIndex] / dstry;
        for (player = 0; player <= 4; player++) nuWon[player] = 0;
        nuWon[f.fPlayer] = win1st[mainIndex];
        sdata.fVThis = value + f.fCalled[f.fPlayer];
        sdata.fVRest = 0;
        if (f.fLevel < 99) {
          if ((pas.DiffBase.Rnd(pas.fdcBase.gfdcRnd,true) % 2) === 1) {
            sdata.fVThis = sdata.fVThis + (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVThis);
            sdata.fVRest = sdata.fVRest - (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVRest);
          } else {
            sdata.fVThis = sdata.fVThis - (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVThis);
            sdata.fVRest = sdata.fVRest + (((0.25 * (99 - f.fLevel)) / 99) * sdata.fVRest);
          };
        };
        sdata.fTricks = win1st[mainIndex] / played[mainIndex];
        $mod.AdaptSearchInfo(info,card,value,$mod.DATATRIPLE.$clone(sdata),nuWon.slice(0),played[mainIndex]);
      };
    };
  };
  this.InitfdcSearch = function () {
    pas.fdcBase.ClearOptions($mod.gSearchOptions);
  };
  this.FreefdcSearch = function () {
  };
  $mod.$implcode = function () {
    $impl.kSHandHigh = 27 - 1;
    $mod.$rtti.$StaticArray("SEARCHHAND",{dims: [27], eltype: pas.DiffBase.$rtti["TCard"]});
  };
},["DiffPlay","StdUtils","DiffCmds"]);
rtl.module("fdcPlay",["System","DiffBase","fdcBase","fdcCll","fdcGuess","fdcSrch"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"fdcCARD",function () {
    this.fGoFor = 0;
    this.fCard = 0;
    this.fValue = 0.0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTrick = pas.DiffBase.TTrick.$new();
      return r;
    };
    this.$eq = function (b) {
      return (this.fGoFor === b.fGoFor) && (this.fCard === b.fCard) && (this.fValue === b.fValue) && this.fTrick.$eq(b.fTrick);
    };
    this.$assign = function (s) {
      this.fGoFor = s.fGoFor;
      this.fCard = s.fCard;
      this.fValue = s.fValue;
      this.fTrick.$assign(s.fTrick);
      return this;
    };
    var $r = $mod.$rtti.$Record("fdcCARD",{},this);
    $r.addField("fGoFor",pas.fdcBase.$rtti["PLAYMODE"]);
    $r.addField("fCard",pas.DiffBase.$rtti["TCard"]);
    $r.addField("fValue",pas.System.$rtti["Single"]);
    $r.addField("fTrick",pas.DiffBase.$rtti["TTrick"]);
  });
  this.fdcCARDS$clone = function (a) {
    var b = [];
    b.length = 12;
    for (var c = 0; c < 12; c++) b[c] = $mod.fdcCARD.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("fdcCARDS",{dims: [12], eltype: this.$rtti["fdcCARD"]});
  this.gPlayOptions = pas.fdcBase.fdcOPTIONS.$new();
  this.gAdaptPlay = 0;
  this.ClearfdcCards = function (c) {
    var colour = 0;
    var i = 0;
    for (i = 0; i <= 11; i++) {
      c.get()[i].fGoFor = pas.fdcBase.PLAYMODE.goForZero;
      c.get()[i].fCard = 0;
      c.get()[i].fValue = 0;
    };
  };
  this.ChooseCard = function (f, legal, c) {
    var player = 0;
    var colour = 0;
    var rank = 0;
    var legals = 0;
    var index = 0;
    var count = 0;
    var input = "";
    var pinfo = pas.fdcGuess.PLAYINFO.$new();
    var sinfo = rtl.arraySetLength(null,pas.fdcSrch.SEARCHDATA,12);
    var brute = 0;
    c.fGoFor = pas.fdcBase.GetPlayMode(f,f.fPlayer);
    c.fCard = 0;
    c.fValue = 0;
    c.fTrick.$assign(f.fTricks[f.fTrickNu]);
    legals = 0;
    for (var $l = 0, $end = f.fHandHigh; $l <= $end; $l++) {
      index = $l;
      if (legal.get()[index] !== 0) {
        c.fCard = legal.get()[index];
        legals = legals + 1;
      };
    };
    if (legals <= 1) {
      return}
     else c.fCard = 0;
    if ($impl.gLearnPlay in pas.fdcBase.gLearnOptions.flags) {
      c.fCard = 0;
    } else if (c.fCard === 0) {
      if (!($impl.gBruteSearch in $mod.gPlayOptions.flags)) {
        brute = 36}
       else brute = 26;
      pas.fdcGuess.GuessCards(f,brute);
      pas.fdcGuess.DoPlayInfo(f,legal.get().slice(0),pinfo);
      if (((f.fTrickNu * f.fNuPlayer) + f.fCardCnt) >= brute) {
        pas.fdcSrch.BruteSearch(f,pinfo,{get: function () {
            return sinfo;
          }, set: function (v) {
            sinfo = v;
          }});
        c.fCard = sinfo[0].fCard;
        c.fValue = sinfo[0].fDelta;
        c.fTrick.$assign(f.fTricks[f.fTrickNu]);
        c.fTrick.fPlayed[f.fPlayer] = c.fCard;
      };
      if (c.fCard === 0) {
        if (f.fCardCnt === 0) {
          $impl.ChooseFirst(f,pinfo,c)}
         else if (rtl.eqSet($impl.CardsThatPick(f,rtl.refSet(pas.DiffBase.HandToCardSet(pinfo.fLegal))),{})) {
          $impl.ChooseNotPick(f,pinfo,c)}
         else $impl.ChooseMayPick(f,pinfo,c);
      };
    };
  };
  var points$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = pas.fdcBase.ESTIMATE.$clone(a[c]);
    return b;
  };
  this.EvaluatePlay = function (f, c) {
    var colour = 0;
    var player = 0;
    var trickv = 0;
    var index = 0;
    var tricks = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,5);
    var points = rtl.arraySetLength(null,pas.fdcBase.ESTIMATE,5);
    var estim = pas.fdcBase.ESTIMATE.$new();
    var ecomp = pas.fdcBase.ESTIMATE.$new();
    if (rtl.eqSet(rtl.intersectSet(rtl.createSet($impl.gLearnPlay,$mod.gAdaptPlay),pas.fdcBase.gLearnOptions.flags),{})) {
      return;
    };
    for (colour = 0; colour <= 4; colour++) {
      pas.fdcBase.SetEstimate(tricks[colour],0,1);
      pas.fdcBase.SetEstimate(points[colour],0,1);
    };
  };
  this.InitfdcPlay = function () {
    $impl.gLearnPlay = pas.fdcBase.DefineOption(pas.fdcBase.gLearnOptions,"play");
    $mod.gAdaptPlay = pas.fdcBase.DefineOption(pas.fdcBase.gLearnOptions,"adapt_play");
    pas.fdcBase.ClearOptions($mod.gPlayOptions);
    $impl.gBruteSearch = pas.fdcBase.DefineOption($mod.gPlayOptions,"brute");
    $mod.gPlayOptions.flags = rtl.unionSet($mod.gPlayOptions.flags,rtl.createSet($impl.gBruteSearch));
  };
  this.FreefdcPlay = function () {
  };
  $mod.$implcode = function () {
    $impl.kFirstTricks = 2;
    $impl.kLowerBound = -6;
    $impl.kUpperBound = +4;
    $impl.kMagic2Pt5 = 2.5;
    $impl.gLearnPlay = 0;
    $impl.gBruteSearch = 0;
    $impl.SignR = function (r) {
      var Result = 0.0;
      if (r > 0) {
        Result = +1}
       else if (r < 0) {
        Result = -1}
       else Result = 0;
      return Result;
    };
    $impl.CurrentRank = function (f, card) {
      var Result = 0;
      var rank = 0;
      var curr = 0;
      rank = pas.fdcBase.gCardRank[f.fTrump][card];
      curr = 0;
      while (rank >= 1) {
        if (f.fBocks[pas.DiffBase.gColourOf[card]][rank]) curr = curr + 1;
        rank = rank - 1;
      };
      Result = curr;
      return Result;
    };
    $impl.CardsThatPick = function (f, cards) {
      var Result = {};
      var hand = rtl.arraySetLength(null,0,12);
      var best = 0;
      var index = 0;
      best = f.fTricks[f.fTrickNu].fPlayed[pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(f.fTricks[f.fTrickNu]))];
      pas.DiffBase.CardSetToHand(rtl.refSet(cards),{get: function () {
          return hand;
        }, set: function (v) {
          hand = v;
        }});
      cards = {};
      for (var $l = 0, $end = f.fHandHigh; $l <= $end; $l++) {
        index = $l;
        if (pas.DiffBase.gBetterCard[f.fTrump][best][hand[index]]) cards = rtl.unionSet(cards,rtl.createSet(hand[index]));
      };
      Result = rtl.refSet(cards);
      return Result;
    };
    $mod.$rtti.$ProcVar("SelFunc",{procsig: rtl.newTIProcSig([["f",pas.fdcBase.$rtti["fdcSTATE"],1],["pinfo",pas.fdcGuess.$rtti["PLAYINFO"],1],["colour",pas.DiffBase.$rtti["TColour"]],["value",pas.System.$rtti["Single"],1]],pas.DiffBase.$rtti["TCardSet"])});
    var select$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = rtl.refSet(a[c]);
      return b;
    };
    $impl.ColourSelect = function (f, playi, selector, nuCol) {
      var Result = {};
      var colour = 0;
      var cards = {};
      var legal = {};
      var value = 0.0;
      var sorted = rtl.arraySetLength(null,0.0,5);
      var select = rtl.arraySetLength(null,0,5);
      var index = 0;
      var jndex = 0;
      var count = 0;
      cards = {};
      legal = rtl.refSet(pas.DiffBase.HandToCardSet(playi.fLegal.slice(0)));
      count = 0;
      for (colour = 1; colour <= 4; colour++) {
        cards = rtl.refSet(selector(f,playi,colour,{get: function () {
            return value;
          }, set: function (v) {
            value = v;
          }}));
        if (rtl.neSet(cards,{})) {
          index = 0;
          while ((index < count) && (value < sorted[index])) {
            index = index + 1;
          };
          jndex = count;
          while (jndex > index) {
            sorted[jndex] = sorted[jndex - 1];
            select[jndex] = rtl.refSet(select[jndex - 1]);
            jndex = jndex - 1;
          };
          sorted[index] = value;
          select[index] = rtl.refSet(cards);
          count = count + 1;
        };
      };
      index = 0;
      while ((index < count) && (nuCol > 0)) {
        cards = rtl.unionSet(cards,rtl.intersectSet(legal,select[index]));
        jndex = index + 1;
        while ((jndex < count) && (sorted[jndex] === sorted[index])) {
          cards = rtl.unionSet(cards,rtl.intersectSet(legal,select[jndex]));
          jndex = jndex + 1;
        };
        index = jndex;
        nuCol = nuCol - 1;
      };
      Result = rtl.refSet(cards);
      return Result;
    };
    $mod.$rtti.$ProcVar("AdjFunc",{procsig: rtl.newTIProcSig([["f",pas.fdcBase.$rtti["fdcSTATE"],1],["pinfo",pas.fdcGuess.$rtti["PLAYINFO"],1],["sdata",pas.fdcSrch.$rtti["SEARCHDATA"]]],pas.System.$rtti["Single"])});
    $impl.AdjustSearch = function (f, playi, info, adjustor) {
      var temp = rtl.arraySetLength(null,pas.fdcSrch.SEARCHDATA,12);
      var delta = 0.0;
      var index = 0;
      pas.fdcSrch.ClearSearchInfo({get: function () {
          return temp;
        }, set: function (v) {
          temp = v;
        }});
      index = 0;
      while (index <= 11) {
        if (info.get()[index].fCard !== 0) {
          delta = adjustor(f,playi,pas.fdcSrch.SEARCHDATA.$clone(info.get()[index]));
          pas.fdcSrch.AdaptSearchInfo({get: function () {
              return temp;
            }, set: function (v) {
              temp = v;
            }},info.get()[index].fCard,delta,pas.fdcSrch.DATATRIPLE.$clone(info.get()[index].fResult),info.get()[index].fWonCnt,info.get()[index].fPlayed);
        };
        index = index + 1;
      };
      info.set(pas.fdcSrch.SEARCHINFO$clone(temp));
    };
    $impl.AdjustPlayStyle = function (f, pinfo, sdata) {
      var Result = 0.0;
      var vneed = 0.0;
      if (sdata.fCard === pas.DiffBase.gCardOf[f.fTrump][6]) {
        if (sdata.fDelta < 0) {
          sdata.fDelta = sdata.fDelta - ((15.0 * (f.fHandHigh - f.fTrickNu)) / (f.fHandHigh + 1))}
         else sdata.fDelta = sdata.fDelta + ((15.0 * (f.fHandHigh - f.fTrickNu)) / (f.fHandHigh + 1));
      };
      vneed = f.fCalled[f.fPlayer] - f.fPtsSoFar[f.fPlayer] - sdata.fResult.fVThis;
      if (vneed > 0) {
        if (sdata.fDelta < 0) {
          sdata.fDelta = sdata.fDelta - (2.5 * (vneed / pas.StdUtils.MaxL(f.fCalled[f.fPlayer],1)))}
         else sdata.fDelta = sdata.fDelta + (2.5 * (vneed / pas.StdUtils.MaxL(f.fCalled[f.fPlayer],1)));
      };
      Result = sdata.fDelta;
      return Result;
    };
    $impl.AdjustPlayOrder = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      var vrest = 0.0;
      value = 0.8 * (1.0 - (sdata.fWonCnt[f.fPNext[f.fPlayer]] / pas.StdUtils.MaxL(sdata.fPlayed,1)));
      if (sdata.fDelta < 0) {
        sdata.fDelta = sdata.fDelta - value}
       else sdata.fDelta = sdata.fDelta + value;
      value = 1.2 * (sdata.fWonCnt[f.fPPrev[f.fPlayer]] / pas.StdUtils.MaxL(sdata.fPlayed,1));
      if (sdata.fDelta < 0) {
        sdata.fDelta = sdata.fDelta - value}
       else sdata.fDelta = sdata.fDelta + value;
      Result = sdata.fDelta;
      return Result;
    };
    $impl.AdjustPreferThin = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      var colour = 0;
      var crank = 0;
      var count = 0;
      colour = pas.DiffBase.gColourOf[sdata.fCard];
      count = f.fNuCards[colour];
      crank = $impl.CurrentRank(f,sdata.fCard);
      value = Math.abs((0.8 * count) - (1.0 * crank)) / (0.8 * 2.5);
      if (sdata.fDelta < 0) {
        sdata.fDelta = sdata.fDelta - (value * (1.0 - (sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1))))}
       else sdata.fDelta = sdata.fDelta + (value * (1.0 - (sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1))));
      Result = sdata.fDelta;
      return Result;
    };
    $impl.GoingCautious = function (f, pinfo) {
      var Result = false;
      Result = (f.fCalled[f.fPlayer] === 0) || (f.fPtsSoFar[f.fPlayer] >= f.fCalled[f.fPlayer]) || ((f.fTrickNu >= 2) && (pinfo.fGuessed >= f.fCalled[f.fPlayer]));
      return Result;
    };
    $impl.sinfo = rtl.arraySetLength(null,pas.fdcSrch.SEARCHDATA,12);
    $impl.cards = {};
    $impl.legal = {};
    $impl.index = 0;
    $impl.SelectUnsure = function (f, pinfo, colour, value) {
      var Result = {};
      var patt = 0;
      Result = {};
      patt = pinfo.fPattern[colour];
      if ((colour !== f.fTrump) && (patt > 0) && (pas.fdcBase.gNuCards[patt] <= 2) && (((patt % 8) === 0) || (pas.DiffBase.gRankOf[pas.fdcBase.DoGetNthCard(f,colour,f.fPlayer,pas.fdcBase.gNuCards[patt])] >= 5))) {
        value.set(rtl.trunc(patt / pas.fdcBase.gNuCards[patt]));
        Result = rtl.intersectSet($impl.legal,f.fCardsOf[colour]);
      };
      return Result;
    };
    $impl.SelectVariance = function (f, pinfo, colour, value) {
      var Result = {};
      var emin = pas.fdcBase.ESTIMATE.$new();
      var emax = pas.fdcBase.ESTIMATE.$new();
      Result = {};
      if (pinfo.fPattern[colour] > 0) {
        pas.fdcGuess.GetEstimateFor(f,colour,pas.fdcBase.PLAYMODE.goForZero,pinfo.fPattern[colour],true,pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],emin);
        pas.fdcGuess.GetEstimateFor(f,colour,pas.fdcBase.PLAYMODE.goForMore,pinfo.fPattern[colour],true,pas.fdcBase.gNuCards[pinfo.fPattern[f.fTrump]],emax);
        value.set(Math.abs(emax.evalue - emin.evalue) / pas.StdUtils.MaxL(pas.fdcBase.gNuCards[pinfo.fPattern[colour]],1));
        Result = rtl.intersectSet($impl.legal,f.fCardsOf[colour]);
      };
      return Result;
    };
    $impl.AdjustDefensive = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      var colour = 0;
      value = pas.fdcGuess.colEstimUnsure;
      for (colour = 1; colour <= 4; colour++) {
        if ((colour !== pas.DiffBase.gColourOf[sdata.fCard]) && (pas.fdcGuess.ColourSafety(f,colour,pinfo.fPattern[colour]) > value)) value = pas.fdcGuess.ColourSafety(f,colour,pinfo.fPattern[colour]);
      };
      value = value / (0.80 * pas.fdcGuess.colEstimSure);
      if (value === pas.fdcGuess.colEstimUnsure) value = pas.fdcGuess.colEstimSure;
      value = value * pas.DiffBase.gValueOfCard[f.fTrump][sdata.fCard] * (sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1));
      if (sdata.fDelta < 0) {
        sdata.fDelta = sdata.fDelta - value}
       else sdata.fDelta = sdata.fDelta + value;
      Result = sdata.fDelta;
      return Result;
    };
    $impl.AdjustOffensive = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      if (f.fCalled[f.fPlayer] < ((157 / f.fNuPlayer) - 5)) {
        value = (f.fNuCards[pas.DiffBase.gColourOf[sdata.fCard]] - $impl.CurrentRank(f,sdata.fCard)) / 1.0;
        if (sdata.fDelta < 0) {
          sdata.fDelta = sdata.fDelta - value}
         else sdata.fDelta = sdata.fDelta + value;
      } else {
        sdata.fDelta = $impl.AdjustPreferThin(f,pinfo,pas.fdcSrch.SEARCHDATA.$clone(sdata));
      };
      Result = sdata.fDelta;
      return Result;
    };
    $impl.AdjustPullControl = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      if (pinfo.fGuessed >= (0.9 * f.fCalled[f.fPlayer])) {
        if ((sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)) > 0.20) {
          value = 0.15 * sdata.fDelta;
          if (Math.abs(value) < 3.0) value = $impl.SignR(sdata.fDelta) * 3.0;
          sdata.fDelta = sdata.fDelta + value;
        };
      };
      Result = sdata.fDelta;
      return Result;
    };
    $impl.ChooseFirst = function (f, pinfo, c) {
      $impl.legal = rtl.refSet(pas.DiffBase.HandToCardSet(pinfo.fLegal.slice(0)));
      $impl.cards = rtl.refSet($impl.legal);
      if ((f.fPtsSoFar[f.fPlayer] + f.fRemaining) <= f.fCalled[f.fPlayer]) {}
      else if ($impl.GoingCautious(f,pinfo)) {
        if (pinfo.fPercent >= 1) ;
        $impl.cards = {};
        if (rtl.eqSet($impl.cards,{}) && (f.fTrickNu === 0)) {
          $impl.cards = rtl.refSet($impl.ColourSelect(f,pinfo,$impl.SelectUnsure,1));
        };
        if (rtl.eqSet($impl.cards,{}) && (f.fTrickNu <= 1) && (pinfo.fPercent < 1)) {
          $impl.cards = rtl.refSet($impl.ColourSelect(f,pinfo,$impl.SelectVariance,1));
        };
      } else {
        $impl.cards = {};
        if (rtl.eqSet($impl.cards,{})) {
          $impl.cards = rtl.refSet($impl.ColourSelect(f,pinfo,$impl.SelectUnsure,1));
        };
        if (rtl.eqSet($impl.cards,{})) {
          $impl.cards = rtl.refSet($impl.ColourSelect(f,pinfo,$impl.SelectVariance,1));
        };
      };
      if (rtl.eqSet($impl.cards,{})) $impl.cards = rtl.refSet($impl.legal);
      pas.fdcSrch.TrickSearch(f,rtl.refSet($impl.cards),pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }});
      $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }},$impl.AdjustPlayStyle);
      $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }},$impl.AdjustPlayOrder);
      if ((f.fPtsSoFar[f.fPlayer] + f.fRemaining) <= f.fCalled[f.fPlayer]) {}
      else if ($impl.GoingCautious(f,pinfo)) {
        if (pinfo.fPercent >= 1) {}
        else {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.AdjustDefensive);
        };
        $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
            return this.p.sinfo;
          }, set: function (v) {
            this.p.sinfo = v;
          }},$impl.AdjustPullControl);
      } else {
        $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
            return this.p.sinfo;
          }, set: function (v) {
            this.p.sinfo = v;
          }},$impl.AdjustOffensive);
        $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
            return this.p.sinfo;
          }, set: function (v) {
            this.p.sinfo = v;
          }},$impl.AdjustPullControl);
      };
      c.fCard = $impl.sinfo[0].fCard;
      c.fValue = $impl.sinfo[0].fDelta;
      c.fTrick.$assign(f.fTricks[f.fTrickNu]);
      c.fTrick.fPlayed[f.fPlayer] = c.fCard;
    };
    $impl.value = 0.0;
    $impl.vbest = 0.0;
    $impl.lead = 0;
    $impl.best = 0;
    $impl.winner = 0;
    $impl.AdjustPreferWeak = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      value = (f.fNuCards[pas.DiffBase.gColourOf[sdata.fCard]] - $impl.CurrentRank(f,sdata.fCard)) / 2.5;
      if (sdata.fDelta < 0) {
        sdata.fDelta = sdata.fDelta - (value * (sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)))}
       else sdata.fDelta = sdata.fDelta + (value * (sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)));
      Result = sdata.fDelta;
      return Result;
    };
    $impl.Adjust2ndAvoidStrong = function (f, pinfo, sdata) {
      var Result = 0.0;
      var value = 0.0;
      if ((pas.DiffBase.gColourOf[f.fTricks[f.fTrickNu].fPlayed[f.fTricks[f.fTrickNu].fLeading]] !== f.fTrump) && (pas.DiffBase.gColourOf[sdata.fCard] === f.fTrump)) {
        if (sdata.fDelta < 0) {
          sdata.fDelta = sdata.fDelta - ((sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)) * (157 / (f.fHandHigh + 1)))}
         else sdata.fDelta = sdata.fDelta + ((sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)) * (157 / (f.fHandHigh + 1)));
      } else if (pinfo.fGuessed >= (0.9 * f.fCalled[f.fPlayer])) {
        if ((sdata.fWonCnt[f.fPlayer] / pas.StdUtils.MaxL(sdata.fPlayed,1)) > 0.20) {
          value = 0.15 * sdata.fDelta;
          if (Math.abs(value) < 3.0) value = $impl.SignR(sdata.fDelta) * 3.0;
          sdata.fDelta = sdata.fDelta + value;
        };
      };
      Result = $impl.AdjustPreferThin(f,pinfo,pas.fdcSrch.SEARCHDATA.$clone(sdata));
      return Result;
    };
    $impl.Adjust4thPreciseLast = function (f, pinfo, sdata) {
      var Result = 0.0;
      var deltaThis = 0.0;
      deltaThis = (f.fPtsSoFar[f.fPlayer] + sdata.fResult.fVThis) - f.fCalled[f.fPlayer];
      if ((sdata.fResult.fVRest <= 10) && (deltaThis >= -6) && (deltaThis <= 4)) {
        Result = deltaThis;
      } else {
        Result = $impl.AdjustPreferThin(f,pinfo,pas.fdcSrch.SEARCHDATA.$clone(sdata));
      };
      return Result;
    };
    $impl.ChooseMayPick = function (f, pinfo, c) {
      $impl.winner = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(c.fTrick));
      $impl.best = c.fTrick.fPlayed[$impl.winner];
      $impl.lead = pas.DiffBase.gColourOf[c.fTrick.fPlayed[c.fTrick.fLeading]];
      $impl.legal = rtl.refSet(pas.DiffBase.HandToCardSet(pinfo.fLegal.slice(0)));
      $impl.cards = rtl.refSet($impl.legal);
      if (rtl.eqSet($impl.cards,{})) $impl.cards = rtl.refSet($impl.legal);
      pas.fdcSrch.TrickSearch(f,rtl.refSet($impl.cards),pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }});
      $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }},$impl.AdjustPlayStyle);
      $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
          return this.p.sinfo;
        }, set: function (v) {
          this.p.sinfo = v;
        }},$impl.AdjustPlayOrder);
      if ((f.fPtsSoFar[f.fPlayer] + f.fRemaining) <= f.fCalled[f.fPlayer]) {}
      else if ($impl.GoingCautious(f,pinfo)) {
        if (pinfo.fPercent >= 1) ;
        if (f.fCardCnt === (f.fNuPlayer - 1)) {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.Adjust4thPreciseLast);
        } else if (f.fCardCnt === (f.fNuPlayer - 2)) {
          if (pinfo.fPercent >= (2 / 3)) {
            $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
                return this.p.sinfo;
              }, set: function (v) {
                this.p.sinfo = v;
              }},$impl.AdjustPreferWeak)}
           else $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.AdjustPreferThin);
        } else if (f.fCardCnt === (f.fNuPlayer - 3)) {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.Adjust2ndAvoidStrong);
        };
      } else {
        if (f.fCardCnt === (f.fNuPlayer - 1)) {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.Adjust4thPreciseLast);
        } else if (f.fCardCnt === (f.fNuPlayer - 2)) {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.AdjustPreferThin);
        } else if (f.fCardCnt === (f.fNuPlayer - 3)) {
          $impl.AdjustSearch(f,pinfo,{p: $impl, get: function () {
              return this.p.sinfo;
            }, set: function (v) {
              this.p.sinfo = v;
            }},$impl.Adjust2ndAvoidStrong);
        };
      };
      c.fCard = $impl.sinfo[0].fCard;
      c.fValue = $impl.sinfo[0].fDelta;
      c.fTrick.$assign(f.fTricks[f.fTrickNu]);
      c.fTrick.fPlayed[f.fPlayer] = c.fCard;
    };
    $impl.ChooseNotPick = function (f, pinfo, c) {
      var sinfo = rtl.arraySetLength(null,pas.fdcSrch.SEARCHDATA,12);
      var cards = {};
      var legal = {};
      var value = 0.0;
      var vbest = 0.0;
      var lead = 0;
      var best = 0;
      var winner = 0;
      var index = 0;
      var colour = 0;
      winner = pas.DiffBase.WinnerOfTrick({p: f, get: function () {
          return this.p.fPNext;
        }, set: function (v) {
          this.p.fPNext = v;
        }},f.fTrump,pas.DiffBase.TTrick.$clone(c.fTrick));
      best = c.fTrick.fPlayed[winner];
      lead = pas.DiffBase.gColourOf[c.fTrick.fPlayed[c.fTrick.fLeading]];
      legal = rtl.refSet(pas.DiffBase.HandToCardSet(pinfo.fLegal.slice(0)));
      cards = rtl.refSet(legal);
      if (rtl.eqSet(cards,{})) cards = rtl.refSet(legal);
      pas.fdcSrch.TrickSearch(f,rtl.refSet(cards),pinfo,{get: function () {
          return sinfo;
        }, set: function (v) {
          sinfo = v;
        }});
      if ((f.fPtsSoFar[f.fPlayer] + f.fRemaining) <= f.fCalled[f.fPlayer]) {
        colour = pas.DiffBase.gColourOf[sinfo[0].fCard];
        for (index = 1; index <= 11; index++) {
          if ((pas.DiffBase.gColourOf[sinfo[index].fCard] === colour) && (pas.fdcBase.gCardRank[f.fTrump][sinfo[0].fCard] > pas.fdcBase.gCardRank[f.fTrump][sinfo[index].fCard]) && (pas.DiffBase.gValueOfCard[f.fTrump][sinfo[0].fCard] >= pas.DiffBase.gValueOfCard[f.fTrump][sinfo[index].fCard])) sinfo[0].$assign(sinfo[index]);
        };
      } else if ($impl.GoingCautious(f,pinfo)) {
        if (pinfo.fPercent >= 1) {
          colour = pas.DiffBase.gColourOf[sinfo[0].fCard];
          for (index = 1; index <= 11; index++) {
            if ((pas.DiffBase.gColourOf[sinfo[index].fCard] === colour) && (pas.fdcBase.gCardRank[f.fTrump][sinfo[0].fCard] < pas.fdcBase.gCardRank[f.fTrump][sinfo[index].fCard]) && (pas.DiffBase.gValueOfCard[f.fTrump][sinfo[0].fCard] <= pas.DiffBase.gValueOfCard[f.fTrump][sinfo[index].fCard])) sinfo[0].$assign(sinfo[index]);
          };
        } else {
          colour = pas.DiffBase.gColourOf[sinfo[0].fCard];
          for (index = 1; index <= 11; index++) {
            if ((pas.DiffBase.gColourOf[sinfo[index].fCard] === colour) && (pas.fdcBase.gCardRank[f.fTrump][sinfo[0].fCard] < pas.fdcBase.gCardRank[f.fTrump][sinfo[index].fCard]) && (pas.DiffBase.gValueOfCard[f.fTrump][sinfo[0].fCard] <= pas.DiffBase.gValueOfCard[f.fTrump][sinfo[index].fCard])) sinfo[0].$assign(sinfo[index]);
          };
        };
      } else {
        $impl.AdjustSearch(f,pinfo,{get: function () {
            return sinfo;
          }, set: function (v) {
            sinfo = v;
          }},$impl.AdjustPreferThin);
      };
      c.fCard = sinfo[0].fCard;
      c.fValue = sinfo[0].fDelta;
      c.fTrick.$assign(f.fTricks[f.fTrickNu]);
      c.fTrick.fPlayed[f.fPlayer] = c.fCard;
    };
  };
},["StdUtils","DiffPlay"]);
rtl.module("fdcJass",["System"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.InitfdcJasser = function () {
    var afdcJasser = null;
    pas.fdcBase.gfdcRnd = pas.DiffBase.NewRnd("Trashy");
    pas.DiffBase.SetRnd(pas.fdcBase.gfdcRnd,1);
    pas.fdcBase.InitfdcBase();
    pas.fdcCll.InitfdcCall();
    pas.fdcGuess.InitfdcGuess();
    pas.fdcSrch.InitfdcSearch();
    pas.fdcPlay.InitfdcPlay();
    afdcJasser = $impl.TfdcJasser.$create("IJassHandler$2",[0]);
    pas.DiffPlay.DeclareHandler(afdcJasser,"Trashy1");
    $impl.gFixCountDown = 1000;
    $impl.gDECCountDown = false;
  };
  this.FreefdcJasser = function () {
    pas.fdcPlay.FreefdcPlay();
    pas.fdcSrch.FreefdcSearch();
    pas.fdcGuess.FreefdcGuess();
    pas.fdcCll.FreefdcCall();
    pas.fdcBase.FreefdcBase();
  };
  $mod.$implcode = function () {
    $impl.kfdcJasserRsrc = 8000;
    $impl.kfdcJasserIcons = 8100;
    $impl.kFixCountNext = 1000;
    rtl.createClass($impl,"TfdcJasser",pas.Jassers.TProtoJasser,function () {
      this.$init = function () {
        pas.Jassers.TProtoJasser.$init.call(this);
        this.fState = pas.fdcBase.fdcSTATE.$new();
        this.fCall = pas.fdcCll.fdcCALL.$new();
        this.fCards = rtl.arraySetLength(null,pas.fdcPlay.fdcCARD,12);
        this.fStats = null;
      };
      this.$final = function () {
        this.fState = undefined;
        this.fCall = undefined;
        this.fCards = undefined;
        pas.Jassers.TProtoJasser.$final.call(this);
      };
      this.IJassHandler$2 = function (player) {
        var p = 0;
        var count = 0;
        var saveRes = 0;
        pas.Jassers.TProtoJasser.IJassHandler$1.call(this,player);
        this.fStats = null;
        return this;
      };
      this.NewInstance = function (player) {
        var Result = null;
        var afdcJasser = null;
        afdcJasser = $impl.TfdcJasser.$create("IJassHandler$2",[player]);
        Result = afdcJasser;
        return Result;
      };
      this.About = function () {
      };
      this.Edit = function () {
      };
      this.HandleRequest = function (aReq, answer) {
        var playC = null;
        var i = 0;
        var c = 0;
        var ignore = false;
        pas.DiffCmds.InitCommand(answer,0);
        var $tmp = aReq.fCmdID;
        if ($tmp === 2002) {
          pas.DiffCmds.InitCommand(answer,2002);
          pas.fdcCll.ChooseCall(this.fState,this.fCall);
          answer.fCData.fPlayer = this.fPlayer;
          answer.fCData.fCall = Math.round(this.fCall.fVCall);
        } else if ($tmp === 2003) {
          playC = aReq.fCData;
          pas.fdcPlay.ChooseCard(this.fState,{p: playC, get: function () {
              return this.p.fLegal;
            }, set: function (v) {
              this.p.fLegal = v;
            }},this.fCards[this.fState.fTrickNu]);
          pas.DiffCmds.InitCommand(answer,2004);
          answer.fCData.fPlayer = this.fPlayer;
          if (this.fCards[this.fState.fTrickNu].fCard !== 0) {
            answer.fCData.fCard = this.fCards[this.fState.fTrickNu].fCard;
          } else {
            i = 0;
            c = 0;
            while (i <= this.fState.fHandHigh) {
              if (playC.fLegal[i] !== 0) c = c + 1;
              i = i + 1;
            };
            c = pas.DiffBase.Rnd(pas.fdcBase.gfdcRnd,true) % c;
            i = 0;
            while ((i <= this.fState.fHandHigh) && (c >= 0)) {
              if (playC.fLegal[i] !== 0) c = c - 1;
              i = i + 1;
            };
            answer.fCData.fCard = playC.fLegal[i - 1];
            this.fCards[this.fState.fTrickNu].fCard = playC.fLegal[i - 1];
          };
        } else if ($tmp === 2008) {
          pas.DiffCmds.InitCommand(answer,2008);
          answer.fCData.fPlayer = this.fPlayer;
          answer.fCData.fStockings = 0;
          if (aReq.fCData.fStockings >= 2) {
            if (this.fState.fPtsSoFar[this.fPlayer] > (this.fState.fCalled[this.fPlayer] + 10)) answer.fCData.fStockings = 2;
          };
        } else if ($tmp === 2020) {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        } else {
          pas.DiffPlay.TJassHandler.HandleRequest.call(this,pas.DiffCmds.TCommand.$clone(aReq),answer);
        };
      };
      this.NotifyCommand = function (aCmd) {
        var delta = 0;
        var countC = null;
        var winnerC = null;
        var p = 0;
        var h = 0;
        var s = "";
        pas.Jassers.TProtoJasser.NotifyCommand.call(this,pas.DiffCmds.TCommand.$clone(aCmd));
        var $tmp = aCmd.fCmdID;
        if ($tmp === 1100) {
          pas.fdcBase.SetupfdcState(this.fState,aCmd.fCData);
          if (this.fStats === null) {
            s = "";
            for (h = 0; h <= 9; h++) {
              p = this.fState.fPNext[this.fPlayer];
              do {
                if (aCmd.fCData.fTypes[p] === h) {
                  if (s === "") {
                    s = pas.fdcBase.TruncateToLastSpace(aCmd.fCData.fNames[p])}
                   else s = s.concat(" ",pas.fdcBase.TruncateToLastSpace(aCmd.fCData.fNames[p]));
                };
                p = this.fState.fPNext[p];
              } while (!((p === this.fPlayer) || (p === 0)));
            };
            this.fStats = pas.fdcBase.LookupfdcStats(s,this.fState.fNuPlayer);
          };
        } else if ($tmp === 2000) {
          pas.fdcBase.DealfdcState(this.fState,aCmd.fCData);
          pas.fdcCll.ClearfdcCall(this.fCall);
          $impl.gDECCountDown = true;
        } else if ($tmp === 2001) {
          pas.fdcBase.EditfdcState(this.fState,aCmd.fCData);
        } else if ($tmp === 2002) {
          if (aCmd.fCData.fPlayer === this.fState.fPlayer) this.fCall.fVCall = aCmd.fCData.fCall;
          pas.fdcBase.CallfdcState(this.fState,aCmd.fCData);
          pas.fdcPlay.ClearfdcCards({p: this, get: function () {
              return this.p.fCards;
            }, set: function (v) {
              this.p.fCards = v;
            }});
        } else if ($tmp === 2004) {
          if (aCmd.fCData.fPlayer === this.fState.fPlayer) this.fCards[this.fState.fTrickNu].fCard = aCmd.fCData.fCard;
          pas.fdcBase.CardfdcState(this.fState,aCmd.fCData);
        } else if ($tmp === 2005) {
          countC = aCmd.fCData;
          pas.fdcBase.CountfdcState(this.fState,countC);
          if (countC.fMade[this.fPlayer] < 0) {
            this.fCall.fFinal = countC.fCall[this.fPlayer]}
           else this.fCall.fFinal = countC.fMade[this.fPlayer];
          if (this.fStats !== null) {
            pas.fdcBase.UpdatefdcStats(this.fState,this.fStats,countC,null);
          };
          if ($impl.gDECCountDown) {
            $impl.gFixCountDown = pas.StdUtils.MaxL(-1,$impl.gFixCountDown - 1);
            $impl.gDECCountDown = false;
            if (($impl.gFixCountDown === 0) && rtl.neSet(rtl.intersectSet(rtl.createSet(pas.fdcCll.gAdaptCall,pas.fdcPlay.gAdaptPlay),pas.fdcBase.gLearnOptions.flags),{})) {
              if (pas.fdcCll.gAdaptCall in pas.fdcBase.gLearnOptions.flags) {
                pas.fdcCll.DoTableReset("c4  set 100");
              };
              if (pas.fdcPlay.gAdaptPlay in pas.fdcBase.gLearnOptions.flags) {
                pas.fdcCll.DoTableFixing("p4=+ -v");
                pas.fdcCll.DoTableFixing("p4+ -v");
                pas.fdcCll.DoTableReset("p4= set 100");
                pas.fdcCll.DoTableReset("p4+ set 100");
              };
              $impl.gFixCountDown = 1000;
            };
          };
        } else if ($tmp === 2010) {
          winnerC = aCmd.fCData;
          if (this.fStats !== null) {
            pas.fdcBase.UpdatefdcStats(this.fState,this.fStats,null,winnerC);
          };
        };
      };
      this.Free$1 = function () {
        pas.DiffPlay.TJassHandler.Free$1.call(this);
      };
    });
    $impl.gFixCountDown = 0;
    $impl.gDECCountDown = false;
  };
},["StdUtils","ResUtils","Jassers","WinFile","DiffBase","DiffPlay","DiffNet","fdcBase","fdcGuess","fdcCll","fdcSrch","fdcPlay","DiffCmds"]);
rtl.module("program",["System","DiffBase","DecOnMac","rgJasser","HackrJss","fdcJass"],function () {
  "use strict";
  var $mod = this;
  $mod.$main = function () {
    pas.DiffBase.InitDiffBase();
    pas.DecOnMac.InitDEConMAC();
  };
});

rtl.run(); return { pas, rtl };
}
