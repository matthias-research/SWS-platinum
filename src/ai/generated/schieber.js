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
rtl.module("SWSBase",["System","StdUtils"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  this.NoColour = 0;
  this.Spades = 1;
  this.Hearts = 2;
  this.Diamonds = 3;
  this.Clubs = 4;
  this.kColourHigh = 4;
  this.TopDown = 5;
  this.BottomUp = 6;
  this.kTrumpHigh = 6;
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
  this.NoTeam = 0;
  this.TeamNS = 1;
  this.TeamWE = 2;
  this.kTeamHigh = 2;
  this.kHandHigh = 9 - 1;
  this.kSuitsHigh = 5 - 1;
  this.kTricksHigh = 8 + 1;
  this.kRoundsHigh = 48 - 1;
  this.kNoRnd = 0;
  this.kMaxRnd = 10;
  this.kPointsPerRound = 157;
  this.$rtti.$Int("TRank",{minvalue: 0, maxvalue: 9, ordtype: 1});
  this.$rtti.$Set("TRankSet",{comptype: this.$rtti["TRank"]});
  this.$rtti.$Int("TColour",{minvalue: 0, maxvalue: 4, ordtype: 1});
  this.$rtti.$Set("TColourSet",{comptype: this.$rtti["TColour"]});
  this.$rtti.$Int("TTrump",{minvalue: 0, maxvalue: 6, ordtype: 1});
  this.$rtti.$Set("TTrumpSet",{comptype: this.$rtti["TTrump"]});
  this.$rtti.$Int("TCard",{minvalue: 0, maxvalue: 36, ordtype: 1});
  this.$rtti.$Set("TCardSet",{comptype: this.$rtti["TCard"]});
  this.$rtti.$Int("TPlayer",{minvalue: 0, maxvalue: 4, ordtype: 1});
  this.$rtti.$Set("TPlayerSet",{comptype: this.$rtti["TPlayer"]});
  this.$rtti.$Int("TTeam",{minvalue: 0, maxvalue: 2, ordtype: 1});
  this.$rtti.$Set("TTeamSet",{comptype: this.$rtti["TTeam"]});
  this.$rtti.$StaticArray("THand",{dims: [9], eltype: this.$rtti["TCard"]});
  this.THands$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("THands",{dims: [5,9], eltype: this.$rtti["TCard"]});
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
  rtl.recNewT(this,"TSuit",function () {
    this.fValue = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fCards = {};
      return r;
    };
    this.$eq = function (b) {
      return rtl.eqSet(this.fCards,b.fCards) && (this.fValue === b.fValue);
    };
    this.$assign = function (s) {
      this.fCards = rtl.refSet(s.fCards);
      this.fValue = s.fValue;
      return this;
    };
    var $r = $mod.$rtti.$Record("TSuit",{},this);
    $r.addField("fCards",$mod.$rtti["TCardSet"]);
    $r.addField("fValue",rtl.longint);
  });
  rtl.recNewT(this,"TSuits",function () {
    this.fCount = 0;
    this.fCalls$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = $mod.TSuit.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fCalls = rtl.arraySetLength(null,$mod.TSuit,5);
      return r;
    };
    this.$eq = function (b) {
      return (this.fCount === b.fCount) && rtl.arrayEq(this.fCalls,b.fCalls);
    };
    this.$assign = function (s) {
      this.fCount = s.fCount;
      this.fCalls = this.fCalls$a$clone(s.fCalls);
      return this;
    };
    var $r = $mod.$rtti.$Record("TSuits",{},this);
    $r.addField("fCount",rtl.longint);
    $mod.$rtti.$StaticArray("TSuits.fCalls$a",{dims: [5], eltype: $mod.$rtti["TSuit"]});
    $r.addField("fCalls",$mod.$rtti["TSuits.fCalls$a"]);
  });
  this.$rtti.$StaticArray("TPoints",{dims: [3], eltype: rtl.longint});
  this.$rtti.$StaticArray("TPlayCircle",{dims: [5], eltype: this.$rtti["TPlayer"]});
  rtl.recNewT(this,"TRound",function () {
    this.fTrump = 0;
    this.fTrumpedBy = 0;
    this.fSuits$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = $mod.TSuits.$clone(a[c]);
      return b;
    };
    this.fTrick = 0;
    this.fTricks$a$clone = function (a) {
      var b = [];
      b.length = 10;
      for (var c = 0; c < 10; c++) b[c] = $mod.TTrick.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.fSuits = rtl.arraySetLength(null,$mod.TSuits,5);
      r.fTricks = rtl.arraySetLength(null,$mod.TTrick,10);
      return r;
    };
    this.$eq = function (b) {
      return (this.fTrump === b.fTrump) && (this.fTrumpedBy === b.fTrumpedBy) && rtl.arrayEq(this.fSuits,b.fSuits) && (this.fTrick === b.fTrick) && rtl.arrayEq(this.fTricks,b.fTricks);
    };
    this.$assign = function (s) {
      this.fTrump = s.fTrump;
      this.fTrumpedBy = s.fTrumpedBy;
      this.fSuits = this.fSuits$a$clone(s.fSuits);
      this.fTrick = s.fTrick;
      this.fTricks = this.fTricks$a$clone(s.fTricks);
      return this;
    };
    var $r = $mod.$rtti.$Record("TRound",{},this);
    $r.addField("fTrump",$mod.$rtti["TTrump"]);
    $r.addField("fTrumpedBy",$mod.$rtti["TPlayer"]);
    $mod.$rtti.$StaticArray("TRound.fSuits$a",{dims: [5], eltype: $mod.$rtti["TSuits"]});
    $r.addField("fSuits",$mod.$rtti["TRound.fSuits$a"]);
    $r.addField("fTrick",rtl.longint);
    $mod.$rtti.$StaticArray("TRound.fTricks$a",{dims: [10], eltype: $mod.$rtti["TTrick"]});
    $r.addField("fTricks",$mod.$rtti["TRound.fTricks$a"]);
  });
  rtl.recNewT(this,"TRules",function () {
    this.fPointPlay = false;
    this.fLimit = 0;
    this.fCut = 0;
    this.fRoundLimit = 0;
    this.fLooserBegins = false;
    this.fSuitsEnabled = false;
    this.fSuitAllFourEqs = false;
    this.fSuitCrossingOn = false;
    this.fSuitsComeFirst = false;
    this.fSuitsIncrement = 0;
    this.fMatchBonus = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTrumpFactor = rtl.arraySetLength(null,0,7);
      return r;
    };
    this.$eq = function (b) {
      return (this.fPointPlay === b.fPointPlay) && (this.fLimit === b.fLimit) && (this.fCut === b.fCut) && (this.fRoundLimit === b.fRoundLimit) && (this.fLooserBegins === b.fLooserBegins) && (this.fSuitsEnabled === b.fSuitsEnabled) && (this.fSuitAllFourEqs === b.fSuitAllFourEqs) && (this.fSuitCrossingOn === b.fSuitCrossingOn) && (this.fSuitsComeFirst === b.fSuitsComeFirst) && (this.fSuitsIncrement === b.fSuitsIncrement) && (this.fMatchBonus === b.fMatchBonus) && rtl.arrayEq(this.fTrumpFactor,b.fTrumpFactor);
    };
    this.$assign = function (s) {
      this.fPointPlay = s.fPointPlay;
      this.fLimit = s.fLimit;
      this.fCut = s.fCut;
      this.fRoundLimit = s.fRoundLimit;
      this.fLooserBegins = s.fLooserBegins;
      this.fSuitsEnabled = s.fSuitsEnabled;
      this.fSuitAllFourEqs = s.fSuitAllFourEqs;
      this.fSuitCrossingOn = s.fSuitCrossingOn;
      this.fSuitsComeFirst = s.fSuitsComeFirst;
      this.fSuitsIncrement = s.fSuitsIncrement;
      this.fMatchBonus = s.fMatchBonus;
      this.fTrumpFactor = s.fTrumpFactor.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("TRules",{},this);
    $r.addField("fPointPlay",rtl.boolean);
    $r.addField("fLimit",rtl.longint);
    $r.addField("fCut",rtl.longint);
    $r.addField("fRoundLimit",rtl.longint);
    $r.addField("fLooserBegins",rtl.boolean);
    $r.addField("fSuitsEnabled",rtl.boolean);
    $r.addField("fSuitAllFourEqs",rtl.boolean);
    $r.addField("fSuitCrossingOn",rtl.boolean);
    $r.addField("fSuitsComeFirst",rtl.boolean);
    $r.addField("fSuitsIncrement",rtl.longint);
    $r.addField("fMatchBonus",rtl.longint);
    $mod.$rtti.$StaticArray("TRules.fTrumpFactor$a",{dims: [7], eltype: rtl.longint});
    $r.addField("fTrumpFactor",$mod.$rtti["TRules.fTrumpFactor$a"]);
  });
  rtl.recNewT(this,"TJassState",function () {
    this.fWinner = 0;
    this.fBPrice = 0;
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
      r.fPoints = rtl.arraySetLength(null,0,3);
      r.fTmpPts = rtl.arraySetLength(null,0,3);
      r.fRounds = rtl.arraySetLength(null,$mod.TRound,48);
      r.fHands = rtl.arraySetLength(null,0,5,9);
      return r;
    };
    this.$eq = function (b) {
      return this.fRules.$eq(b.fRules) && rtl.arrayEq(this.fPoints,b.fPoints) && rtl.arrayEq(this.fTmpPts,b.fTmpPts) && (this.fWinner === b.fWinner) && (this.fBPrice === b.fBPrice) && (this.fRoundTotal === b.fRoundTotal) && (this.fRound === b.fRound) && rtl.arrayEq(this.fRounds,b.fRounds) && (this.fLeading === b.fLeading) && rtl.arrayEq(this.fHands,b.fHands);
    };
    this.$assign = function (s) {
      this.fRules.$assign(s.fRules);
      this.fPoints = s.fPoints.slice(0);
      this.fTmpPts = s.fTmpPts.slice(0);
      this.fWinner = s.fWinner;
      this.fBPrice = s.fBPrice;
      this.fRoundTotal = s.fRoundTotal;
      this.fRound = s.fRound;
      this.fRounds = this.fRounds$a$clone(s.fRounds);
      this.fLeading = s.fLeading;
      this.fHands = $mod.THands$clone(s.fHands);
      return this;
    };
    var $r = $mod.$rtti.$Record("TJassState",{},this);
    $r.addField("fRules",$mod.$rtti["TRules"]);
    $r.addField("fPoints",$mod.$rtti["TPoints"]);
    $r.addField("fTmpPts",$mod.$rtti["TPoints"]);
    $r.addField("fWinner",$mod.$rtti["TTeam"]);
    $r.addField("fBPrice",$mod.$rtti["TTeam"]);
    $r.addField("fRoundTotal",rtl.longint);
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
  this.$rtti.$StaticArray("TCounters",{dims: [5], eltype: rtl.longint});
  this.BetterCardTab$clone = function (a) {
    var b = [];
    b.length = 7;
    for (var c = 0; c < 7; c++) {
      var d = b[c] = [];
      d.length = 37;
      var e = a[c];
      for (var f = 0; f < 37; f++) d[f] = e[f].slice(0);
    };
    return b;
  };
  this.$rtti.$StaticArray("BetterCardTab",{dims: [7,37,37], eltype: rtl.boolean});
  this.ValueOfCardTab$clone = function (a) {
    var b = [];
    b.length = 7;
    for (var c = 0; c < 7; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("ValueOfCardTab",{dims: [7,37], eltype: rtl.longint});
  this.$rtti.$StaticArray("ColourNameTab",{dims: [5], eltype: rtl.string});
  this.$rtti.$StaticArray("RankNameTab",{dims: [10], eltype: rtl.string});
  this.$rtti.$StaticArray("TrumpNameTab",{dims: [7], eltype: rtl.string});
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
  this.$rtti.$StaticArray("gTeamOf$a",{dims: [5], eltype: this.$rtti["TTeam"]});
  this.gTeamOf = rtl.arraySetLength(null,0,5);
  this.gNextPlayer = rtl.arraySetLength(null,0,5);
  this.gPrevPlayer = rtl.arraySetLength(null,0,5);
  this.$rtti.$StaticArray("gTrumpRank$a",{dims: [10], eltype: this.$rtti["TRank"]});
  this.gTrumpRank = rtl.arraySetLength(null,0,10);
  this.gBetterCard = rtl.arraySetLength(null,false,7,37,37);
  this.gValueOfCard = rtl.arraySetLength(null,0,7,37);
  this.gColourName = rtl.arraySetLength(null,"",5);
  this.gRankName = rtl.arraySetLength(null,"",10);
  this.gTrumpName = rtl.arraySetLength(null,"",7);
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
    if ($mod.ValidRules($mod.TRules.$clone(rules))) $impl.gGlobalRules.$assign(rules);
  };
  this.GetGlobalRules = function (rules) {
    rules.$assign($impl.gGlobalRules);
  };
  this.ValidRules = function (rules) {
    var Result = false;
    var valid = false;
    var gotOne = false;
    var trump = 0;
    valid = true;
    valid = valid && (rules.fLimit > 0);
    valid = valid && (rules.fRoundLimit > 0);
    gotOne = false;
    for (trump = 1; trump <= 6; trump++) {
      gotOne = gotOne || (rules.fTrumpFactor[trump] > 0);
      valid = valid && (rules.fTrumpFactor[trump] >= 0) && (rules.fTrumpFactor[trump] <= 10);
    };
    valid = valid && gotOne;
    valid = valid && (rules.fMatchBonus >= 0);
    Result = valid;
    return Result;
  };
  this.FactorOfTrump = function (rules, trump) {
    var Result = 0;
    if ((trump > 0) && (trump <= 6)) {
      Result = rules.fTrumpFactor[trump];
    } else {
      Result = 0;
      $mod.LogWriteLn("***JassBase: FactorOfTrump - Illegal trump.");
    };
    return Result;
  };
  this.ValueOfCard = function (trump, card) {
    var Result = 0;
    var $tmp = $mod.gRankOf[card];
    if ($tmp === 1) {
      if (trump === 6) {
        Result = 11}
       else Result = 0}
     else if ($tmp === 2) {
      Result = 0}
     else if ($tmp === 3) {
      if (trump in rtl.createSet(5,6)) {
        Result = 8}
       else Result = 0}
     else if ($tmp === 4) {
      if (trump === $mod.gColourOf[card]) {
        Result = 14}
       else Result = 0}
     else if ($tmp === 5) {
      Result = 10}
     else if ($tmp === 6) {
      if (trump === $mod.gColourOf[card]) {
        Result = 20}
       else Result = 2}
     else if ($tmp === 7) {
      Result = 3}
     else if ($tmp === 8) {
      Result = 4}
     else if ($tmp === 9) {
      if (trump === 6) {
        Result = 0}
       else Result = 11}
     else {
      Result = 0;
    };
    return Result;
  };
  this.ValueOfSuit = function (trump, firstOnly, suit) {
    var Result = 0;
    var i = 0;
    var value = 0;
    value = 0;
    if (firstOnly) {
      if (suit.fCount > 0) value = rtl.trunc(suit.fCalls[0].fValue / 10) * 10;
    } else {
      for (var $l = 0, $end = suit.fCount - 1; $l <= $end; $l++) {
        i = $l;
        value = value + (rtl.trunc(suit.fCalls[i].fValue / 10) * 10);
      };
    };
    Result = value;
    return Result;
  };
  this.ValueOfTrick = function (trump, trick) {
    var Result = 0;
    var sum = 0;
    var p = 0;
    Result = 0;
    if ((trump <= 0) || (trump > 6)) {
      return Result;
    };
    sum = 0;
    for (p = 1; p <= 4; p++) {
      if ((trick.fPlayed[p] > 0) && (trick.fPlayed[p] <= 36)) sum = sum + $mod.gValueOfCard[trump][trick.fPlayed[p]];
    };
    Result = sum;
    return Result;
  };
  this.ValueOfSuits = function (rules, round, pts) {
    pts.get()[1] = 0;
    pts.get()[2] = 0;
    if (round.fTrick > 0) {
      pts.get()[1] = $mod.ValueOfSuit(round.fTrump,false,$mod.TSuits.$clone(round.fSuits[1])) + $mod.ValueOfSuit(round.fTrump,false,$mod.TSuits.$clone(round.fSuits[3]));
      pts.get()[2] = $mod.ValueOfSuit(round.fTrump,false,$mod.TSuits.$clone(round.fSuits[2])) + $mod.ValueOfSuit(round.fTrump,false,$mod.TSuits.$clone(round.fSuits[4]));
    };
    pts.get()[1] = pts.get()[1] * $mod.FactorOfTrump($mod.TRules.$clone(rules),round.fTrump);
    pts.get()[2] = pts.get()[2] * $mod.FactorOfTrump($mod.TRules.$clone(rules),round.fTrump);
  };
  this.ValueOfRound = function (rules, round, pts, match) {
    var i = 0;
    var twnNS = 0;
    var twnWE = 0;
    var sts = rtl.arraySetLength(null,0,3);
    $mod.ValueOfSuits($mod.TRules.$clone(rules),$mod.TRound.$clone(round),{get: function () {
        return sts;
      }, set: function (v) {
        sts = v;
      }});
    pts.get()[1] = 0;
    pts.get()[2] = 0;
    twnNS = 0;
    twnWE = 0;
    match.set(0);
    for (var $l = 0, $end = round.fTrick - 1; $l <= $end; $l++) {
      i = $l;
      var $tmp = $mod.gTeamOf[round.fTricks[i + 1].fLeading];
      if ($tmp === 1) {
        pts.get()[1] = pts.get()[1] + $mod.ValueOfTrick(round.fTrump,$mod.TTrick.$clone(round.fTricks[i]));
        twnNS = twnNS + 1;
      } else if ($tmp === 2) {
        pts.get()[2] = pts.get()[2] + $mod.ValueOfTrick(round.fTrump,$mod.TTrick.$clone(round.fTricks[i]));
        twnWE = twnWE + 1;
      } else {
        $mod.LogWriteLn("***JassBase: ValueOfRound - Illegal team.");
      };
    };
    if (round.fTrick >= 9) {
      if ($mod.gTeamOf[round.fTricks[9].fLeading] === 1) {
        pts.get()[1] = pts.get()[1] + 5}
       else pts.get()[2] = pts.get()[2] + 5;
      if (twnNS === 0) {
        pts.get()[2] = pts.get()[2] + rules.fMatchBonus;
        match.set(2);
      } else if (twnWE === 0) {
        pts.get()[1] = pts.get()[1] + rules.fMatchBonus;
        match.set(1);
      };
    };
    pts.get()[1] = sts[1] + (pts.get()[1] * $mod.FactorOfTrump($mod.TRules.$clone(rules),round.fTrump));
    pts.get()[2] = sts[2] + (pts.get()[2] * $mod.FactorOfTrump($mod.TRules.$clone(rules),round.fTrump));
  };
  this.GetNuOfTricksWon = function (round, count, index) {
    var p = 0;
    var i = 0;
    for (p = 1; p <= 4; p++) count.get()[p] = 0;
    if ((round.fTrick > 9) || (round.fTrump === 0)) return;
    for (var $l = 0, $end = round.fTrick - 1; $l <= $end; $l++) {
      i = $l;
      p = round.fTricks[i + 1].fLeading;
      index.get()[p][count.get()[p]] = i;
      count.get()[p] = count.get()[p] + 1;
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
  this.Stockings = function (rules, trump) {
    var Result = {};
    if (rules.fSuitsEnabled && (trump >= 1) && (trump <= 4)) {
      Result = rtl.createSet($mod.gCardOf[trump][7],$mod.gCardOf[trump][8])}
     else Result = {};
    return Result;
  };
  this.BetterCard = function (trump, prev, This) {
    var Result = false;
    if (This === 0) {
      Result = false}
     else if (prev === 0) {
      Result = true}
     else {
      var $tmp = trump;
      if (($tmp === 1) || ($tmp === 2) || ($tmp === 3) || ($tmp === 4)) {
        if ($mod.gColourOf[This] === trump) {
          Result = ($mod.gColourOf[prev] !== trump) || ($mod.TrumpRank($mod.gRankOf[This]) > $mod.TrumpRank($mod.gRankOf[prev]))}
         else Result = ($mod.gColourOf[This] === $mod.gColourOf[prev]) && ($mod.gRankOf[This] > $mod.gRankOf[prev])}
       else if ($tmp === 5) {
        Result = ($mod.gColourOf[This] === $mod.gColourOf[prev]) && ($mod.gRankOf[This] > $mod.gRankOf[prev])}
       else if ($tmp === 6) {
        Result = ($mod.gColourOf[This] === $mod.gColourOf[prev]) && ($mod.gRankOf[This] < $mod.gRankOf[prev])}
       else {
        $mod.LogWriteLn("***JassBase: BetterCard - Illegal trump.");
      };
    };
    return Result;
  };
  this.WinnerOfTrick = function (trump, trick) {
    var Result = 0;
    var best = 0;
    var curr = 0;
    Result = 0;
    if ((trump <= 0) || (trump > 6)) {
      return Result;
    };
    best = trick.fLeading;
    if ((best <= 0) || (best > 4)) {
      return Result;
    };
    for (curr = 1; curr <= 4; curr++) {
      if ((trick.fPlayed[curr] < 0) || (trick.fPlayed[curr] > 36)) trick.fPlayed[curr] = 0;
    };
    curr = $mod.gNextPlayer[best];
    do {
      if ($mod.gBetterCard[trump][trick.fPlayed[best]][trick.fPlayed[curr]]) best = curr;
      curr = $mod.gNextPlayer[curr];
    } while (!(curr === trick.fLeading));
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
  this.HandToCardSet = function (hand) {
    var Result = {};
    var cards = {};
    var i = 0;
    cards = {};
    for (i = 0; i <= 8; i++) cards = rtl.unionSet(cards,rtl.createSet(hand[i]));
    Result = rtl.diffSet(cards,rtl.createSet(0));
    return Result;
  };
  this.CardSetToHand = function (cards, hand) {
    var card = 0;
    var i = 0;
    i = 0;
    for (card = 1; card <= 36; card++) {
      if ((card in cards) && (i <= 8)) {
        hand.get()[i] = card;
        i = i + 1;
      };
    };
    while (i <= 8) {
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
    var noTrumps = false;
    var onlyTrumps = false;
    legal.set(hand.slice(0));
    if (trick.fPlayed[trick.fLeading] !== 0) {
      card = trick.fPlayed[trick.fLeading];
      none = true;
      if (trump === $mod.gColourOf[card]) {
        for (i = 0; i <= 8; i++) if ($mod.gColourOf[legal.get()[i]] === trump) {
          none = none && ($mod.gCardOf[trump][6] === legal.get()[i])}
         else legal.get()[i] = 0;
        if (none) legal.set(hand.slice(0));
      } else {
        best = card;
        for (p = 1; p <= 4; p++) if ($mod.gBetterCard[trump][best][trick.fPlayed[p]]) best = trick.fPlayed[p];
        if ($mod.gColourOf[best] === trump) {
          rank = $mod.TrumpRank($mod.gRankOf[best])}
         else rank = 0;
        noTrumps = true;
        onlyTrumps = true;
        for (i = 0; i <= 8; i++) {
          colour = $mod.gColourOf[legal.get()[i]];
          onlyTrumps = onlyTrumps && ((colour === 0) || (colour === trump));
          if (colour === $mod.gColourOf[card]) {
            none = false}
           else if ((colour !== trump) || ($mod.TrumpRank($mod.gRankOf[legal.get()[i]]) < rank)) {
            legal.get()[i] = 0}
           else if (legal.get()[i] !== $mod.gCardOf[trump][6]) noTrumps = false;
        };
        if (onlyTrumps) {
          legal.set(hand.slice(0));
        } else if (none) {
          for (i = 0; i <= 8; i++) {
            if ((hand[i] !== 0) && ($mod.gColourOf[hand[i]] !== trump)) {
              legal.get()[i] = hand[i];
              none = false;
            };
          };
          if (none && noTrumps) legal.set(hand.slice(0));
        };
      };
    };
  };
  this.DealCards = function (hands) {
    var cards = {};
    var card = 0;
    var i = 0;
    var c = 0;
    var count = 0;
    var p = 0;
    cards = rtl.createSet(null,0 + 1,36);
    count = 36;
    for (i = 0; i <= 8; i++) {
      for (p = 1; p <= 4; p++) {
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
    for (i = 0; i <= 8; i++) hands.get()[0][i] = 0;
    for (p = 1; p <= 4; p++) {
      $mod.SortHand({a: p, p: hands.get(), get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }});
    };
  };
  this.GreaterSuit = function (trump, suit1, suit2) {
    var Result = false;
    var v1 = 0;
    var v2 = 0;
    function NumberOfCards(cards) {
      var Result = 0;
      var card = 0;
      var count = 0;
      count = 0;
      for (card = 1; card <= 36; card++) if (card in cards) count = count + 1;
      Result = count;
      return Result;
    };
    function BestRank(suit) {
      var Result = 0;
      var hand = rtl.arraySetLength(null,0,9);
      var i = 0;
      $mod.CardSetToHand(rtl.refSet(suit.fCards),{get: function () {
          return hand;
        }, set: function (v) {
          hand = v;
        }});
      if (trump === 6) {
        Result = $mod.gRankOf[hand[0]]}
       else {
        i = 0;
        while ((i <= 8) && (hand[i] !== 0)) i = i + 1;
        if (i <= 0) {
          Result = 0}
         else Result = $mod.gRankOf[hand[i - 1]];
      };
      return Result;
    };
    function SuitColour(suit) {
      var Result = 0;
      var card = 0;
      if (rtl.eqSet(suit.fCards,{})) {
        Result = 0;
        return Result;
      };
      Result = trump;
      for (card = 1; card <= 36; card++) {
        if (($mod.gColourOf[card] !== trump) && (card in suit.fCards)) {
          Result = 0;
          return Result;
        };
      };
      return Result;
    };
    v1 = (rtl.trunc(suit1.fValue / 10) * 10) + NumberOfCards(rtl.refSet(suit1.fCards));
    v2 = (rtl.trunc(suit2.fValue / 10) * 10) + NumberOfCards(rtl.refSet(suit2.fCards));
    if (v1 > v2) {
      Result = true}
     else if (v1 < v2) {
      Result = false}
     else if (trump === 5) {
      Result = BestRank(suit1) > BestRank(suit2)}
     else if (trump === 6) {
      Result = BestRank(suit1) < BestRank(suit2)}
     else {
      if (BestRank(suit1) !== BestRank(suit2)) {
        Result = BestRank(suit1) > BestRank(suit2)}
       else Result = SuitColour(suit1) === trump;
    };
    return Result;
  };
  this.BetterSuit = function (trump, suit1, suit2) {
    var Result = false;
    if ((suit1.fCount > 0) && (suit2.fCount > 0)) {
      Result = $mod.GreaterSuit(trump,suit1.fCalls[0],suit2.fCalls[0])}
     else Result = suit1.fCount > suit2.fCount;
    return Result;
  };
  this.InsertSuit = function (trump, New, suit) {
    var i = 0;
    var j = 0;
    i = 0;
    while ((i <= 4) && (i < suit.fCount) && rtl.neSet(New.fCards,suit.fCalls[i].fCards)) i = i + 1;
    if (i < suit.fCount) return;
    i = 0;
    while ((i <= 4) && (i < suit.fCount) && !$mod.GreaterSuit(trump,New,suit.fCalls[i])) i = i + 1;
    if (i <= 4) {
      for (var $l = 4, $end = i + 1; $l >= $end; $l--) {
        j = $l;
        suit.fCalls[j].$assign(suit.fCalls[j - 1]);
      };
      suit.fCalls[i].$assign(New);
      suit.fCount = suit.fCount + 1;
    };
  };
  this.GetAllSuits = function (rules, trump, hand, suits) {
    var suit = $mod.TSuit.$new();
    var cards = {};
    var test = {};
    var colour = 0;
    var rank = 0;
    var stop = 0;
    suits.fCount = 0;
    cards = rtl.refSet($mod.HandToCardSet(hand.slice(0)));
    for (rank = 1; rank <= 9; rank++) {
      test = {};
      if (rules.fSuitAllFourEqs || (rank in rtl.createSet(null,4,8)) || ((trump === 6) && (rank === 1)) || ((trump !== 6) && (rank === 9))) {
        for (colour = 1; colour <= 4; colour++) {
          test = rtl.unionSet(test,rtl.createSet($mod.gCardOf[colour][rank]));
        };
      };
      if (rtl.neSet(test,{}) && rtl.eqSet(rtl.intersectSet(test,cards),test)) {
        suit.fCards = rtl.refSet(test);
        if (rank === 6) {
          suit.fValue = 200}
         else if (rank === 4) {
          suit.fValue = 150}
         else suit.fValue = 100;
        suit.fValue = suit.fValue + 4;
        $mod.InsertSuit(trump,$mod.TSuit.$clone(suit),suits);
      };
    };
    for (colour = 1; colour <= 4; colour++) {
      rank = 1;
      while (rank <= 9) {
        while ((rank <= 9) && !($mod.gCardOf[colour][rank] in cards)) rank = rank + 1;
        stop = rank;
        test = {};
        while ((stop <= 9) && ($mod.gCardOf[colour][stop] in cards)) {
          test = rtl.unionSet(test,rtl.createSet($mod.gCardOf[colour][stop]));
          stop = stop + 1;
        };
        if ((rank <= 9) && ((stop - rank) >= 3)) {
          suit.fCards = rtl.refSet(test);
          var $tmp = stop - rank;
          if ($tmp === 3) {
            suit.fValue = 20}
           else if ($tmp === 4) {
            suit.fValue = 50}
           else {
            suit.fValue = 100 + ((stop - rank - 5) * rules.fSuitsIncrement);
          };
          suit.fValue = suit.fValue + (stop - rank);
          $mod.InsertSuit(trump,$mod.TSuit.$clone(suit),suits);
        };
        rank = stop + 1;
      };
    };
  };
  this.GetBestSuit = function (rules, trump, hand, best) {
    var suits = $mod.TSuits.$new();
    var suit = $mod.TSuits.$new();
    var stemp = $mod.TSuits.$new();
    var curr = 0;
    var i = 0;
    var besti = 0;
    var currv = 0;
    var bestv = 0;
    var cards = {};
    var help = rtl.arraySetLength(null,0,9);
    cards = rtl.refSet($mod.HandToCardSet(hand.slice(0)));
    $mod.GetAllSuits($mod.TRules.$clone(rules),trump,hand.slice(0),suits);
    best.fCount = 0;
    bestv = 0;
    if (rules.fSuitCrossingOn) {
      cards = {};
      while (suits.fCount > 0) {
        curr = 0;
        bestv = -2147483647;
        suit.fCount = 0;
        besti = -1;
        while (curr < suits.fCount) {
          if (rtl.neSet(rtl.diffSet(suits.fCalls[curr].fCards,cards),{})) {
            currv = suits.fCalls[curr].fValue;
            stemp.fCount = 1;
            stemp.fCalls[0].$assign(suits.fCalls[curr]);
            if ((currv > bestv) || ((currv === bestv) && $mod.BetterSuit(trump,suit,stemp))) {
              suit.$assign(stemp);
              besti = curr;
              bestv = currv;
            };
          };
          curr = curr + 1;
        };
        if (besti < 0) {
          suits.fCount = 0;
        } else {
          cards = rtl.unionSet(cards,suit.fCalls[0].fCards);
          $mod.InsertSuit(trump,$mod.TSuit.$clone(suit.fCalls[0]),best);
          while (besti < 4) {
            suits.fCalls[besti].$assign(suits.fCalls[besti + 1]);
            besti = besti + 1;
          };
          suits.fCount = suits.fCount - 1;
        };
      };
    } else {
      curr = 0;
      while (curr < suits.fCount) {
        $mod.CardSetToHand(rtl.diffSet(cards,suits.fCalls[curr].fCards),{get: function () {
            return help;
          }, set: function (v) {
            help = v;
          }});
        $mod.GetBestSuit($mod.TRules.$clone(rules),trump,help.slice(0),suit);
        currv = suits.fCalls[curr].fValue + $mod.ValueOfSuit(trump,false,$mod.TSuits.$clone(suit));
        if ((currv > bestv) || ((currv === bestv) && $mod.BetterSuit(trump,best,suit))) {
          best.fCount = 1;
          best.fCalls[0].$assign(suits.fCalls[curr]);
          for (var $l = 0, $end = suit.fCount - 1; $l <= $end; $l++) {
            i = $l;
            $mod.InsertSuit(trump,$mod.TSuit.$clone(suit.fCalls[i]),best);
          };
          bestv = currv;
        };
        curr = curr + 1;
      };
    };
  };
  this.InitJassState = function (state) {
    var i = 0;
    var j = 0;
    var p = 0;
    state.fPoints[0] = 0;
    state.fPoints[1] = 0;
    state.fPoints[2] = 0;
    state.fTmpPts[0] = 0;
    state.fTmpPts[1] = 0;
    state.fTmpPts[2] = 0;
    state.fWinner = 0;
    state.fBPrice = 0;
    state.fRoundTotal = 0;
    state.fRound = 0;
    state.fLeading = 0;
    for (i = 0; i <= 47; i++) {
      state.fRounds[i].fTrump = 0;
      state.fRounds[i].fTrumpedBy = 0;
      state.fRounds[i].fTrick = 0;
      state.fRounds[i].fTricks[0].fLeading = 0;
      for (p = 0; p <= 4; p++) state.fRounds[i].fSuits[p].fCount = 0;
      for (j = 0; j <= 9; j++) {
        for (p = 0; p <= 4; p++) {
          state.fRounds[i].fTricks[j].fPlayed[p] = 0;
        };
      };
    };
    for (p = 0; p <= 4; p++) $mod.CardSetToHand({},{a: p, p: state.fHands, get: function () {
        return this.p[this.a];
      }, set: function (v) {
        this.p[this.a] = v;
      }});
    state.fRounds[0].fTricks[0].fLeading = 0;
  };
  this.SetupJassState = function (state, rules, leads) {
    $mod.InitJassState(state);
    state.fRules.$assign(rules);
    state.fLeading = leads;
    state.fRounds[0].fTricks[0].fLeading = leads;
  };
  this.ResetJassState = function (state) {
    var i = 0;
    var j = 0;
    var p = 0;
    for (i = 0; i <= 47; i++) {
      state.fRounds[i].fTrump = 0;
      state.fRounds[i].fTrumpedBy = 0;
      state.fRounds[i].fTrick = 0;
      state.fRounds[i].fTricks[0].fLeading = 0;
      for (p = 0; p <= 4; p++) state.fRounds[i].fSuits[p].fCount = 0;
      for (j = 0; j <= 9; j++) {
        for (p = 1; p <= 4; p++) {
          state.fRounds[i].fTricks[j].fPlayed[p] = 0;
        };
      };
    };
    state.fPoints[0] = 0;
    state.fPoints[1] = 0;
    state.fPoints[2] = 0;
    state.fTmpPts[0] = 0;
    state.fTmpPts[1] = 0;
    state.fTmpPts[2] = 0;
    state.fWinner = 0;
    state.fBPrice = 0;
    state.fRoundTotal = 0;
    state.fRound = 0;
    state.fLeading = 1;
  };
  this.GetLeadingPlayer = function (state) {
    var Result = 0;
    Result = 0;
    if (state.fRound > 47) return Result;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick < 9) {
      if ($with.fTricks[$with.fTrick].fLeading === 0) {
        Result = state.fLeading}
       else Result = $with.fTricks[$with.fTrick].fLeading;
    };
    return Result;
  };
  this.GetCurrentPlayer = function (state) {
    var Result = 0;
    var p = 0;
    Result = 0;
    if (state.fRound > 47) return Result;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick < 9) {
      p = $with.fTricks[$with.fTrick].fLeading;
      if (p === 0) {
        Result = state.fLeading}
       else if ($with.fTricks[$with.fTrick].fPlayed[p] === 0) {
        Result = p}
       else if ($with.fTricks[$with.fTrick].fPlayed[$mod.gNextPlayer[p]] === 0) {
        Result = $mod.gNextPlayer[p]}
       else if ($with.fTricks[$with.fTrick].fPlayed[$mod.gNextPlayer[$mod.gNextPlayer[p]]] === 0) {
        Result = $mod.gNextPlayer[$mod.gNextPlayer[p]]}
       else if ($with.fTricks[$with.fTrick].fPlayed[$mod.gPrevPlayer[p]] === 0) Result = $mod.gPrevPlayer[p];
    } else {
      Result = $with.fTricks[9].fLeading;
    };
    return Result;
  };
  this.GetCurrentTrick = function (state, trick) {
    var p = 0;
    if (state.fRound > 47) {
      for (p = 0; p <= 4; p++) trick.fPlayed[p] = 0;
      trick.fLeading = 0;
    } else {
      var $with = state.fRounds[state.fRound];
      if ($with.fTrick < 9) {
        trick.$assign($with.fTricks[$with.fTrick])}
       else trick.fLeading = 0;
      trick.fPlayed[0] = 0;
    };
  };
  this.GetCurrentTrump = function (state, trump) {
    if (state.fRound > 47) return;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrick < 9) {
      trump.set($with.fTrump)}
     else trump.set(0);
  };
  this.RoundFinished = function (state) {
    var Result = false;
    Result = (state.fRound >= 47) || (state.fRounds[state.fRound].fTrick >= 9);
    return Result;
  };
  this.MatchFinished = function (state) {
    var Result = false;
    if (state.fRules.fPointPlay) {
      Result = (state.fPoints[1] >= state.fRules.fLimit) || (state.fPoints[2] >= state.fRules.fLimit)}
     else Result = state.fRoundTotal >= state.fRules.fRoundLimit;
    return Result;
  };
  this.PrepareRound = function (state, trump, trumpedBy) {
    var i = 0;
    var j = 0;
    var p = 0;
    state.fTmpPts[0] = state.fPoints[0];
    state.fTmpPts[1] = state.fPoints[1];
    state.fTmpPts[2] = state.fPoints[2];
    if (state.fRound >= 47) {
      for (i = 0; i <= 47; i++) {
        state.fRounds[i].fTrump = 0;
        state.fRounds[i].fTrumpedBy = 0;
        state.fRounds[i].fTrick = 0;
        state.fRounds[i].fTricks[0].fLeading = 0;
        for (p = 0; p <= 4; p++) state.fRounds[i].fSuits[p].fCount = 0;
        for (j = 0; j <= 9; j++) {
          for (p = 1; p <= 4; p++) {
            state.fRounds[i].fTricks[j].fPlayed[p] = 0;
          };
        };
      };
      state.fRound = 0;
    };
    var $with = state.fRounds[state.fRound];
    $with.fTrump = trump;
    $with.fTrumpedBy = trumpedBy;
    for (p = 0; p <= 4; p++) $with.fSuits[p].fCount = 0;
    $with.fTrick = 0;
    for (i = 0; i <= 9; i++) {
      $with.fTricks[i].fLeading = 0;
      for (j = 1; j <= 4; j++) {
        $with.fTricks[i].fPlayed[j] = 0;
      };
    };
    $with.fTricks[$with.fTrick].fLeading = state.fLeading;
  };
  this.FinishRound = function (state, pts, matchBy, signalBPrice, signalWinner) {
    var lookForBPrice = false;
    var lookForWinner = false;
    signalBPrice.set(false);
    signalWinner.set(false);
    lookForBPrice = state.fRules.fPointPlay && (state.fBPrice === 0) && (pas.StdUtils.MaxL(state.fPoints[1],state.fPoints[2]) < state.fRules.fCut);
    lookForWinner = state.fRules.fPointPlay && (state.fWinner === 0) && (pas.StdUtils.MaxL(state.fPoints[1],state.fPoints[2]) < state.fRules.fLimit);
    $mod.ValueOfRound($mod.TRules.$clone(state.fRules),$mod.TRound.$clone(state.fRounds[state.fRound]),pts,matchBy);
    state.fPoints[1] = state.fPoints[1] + pts.get()[1];
    state.fPoints[2] = state.fPoints[2] + pts.get()[2];
    state.fRoundTotal = state.fRoundTotal + 1;
    state.fRound = state.fRound + 1;
    state.fLeading = $mod.gNextPlayer[state.fLeading];
    if (state.fRules.fPointPlay) {
      if (lookForBPrice && ($impl.CheckLimit(state.fPoints[1],state.fPoints[2],state.fRules.fCut) !== 0)) {
        state.fBPrice = $impl.CheckLimit(state.fPoints[1],state.fPoints[2],state.fRules.fCut);
        signalBPrice.set(state.fBPrice !== 0);
      };
      if (lookForWinner && ($impl.CheckLimit(state.fPoints[1],state.fPoints[2],state.fRules.fLimit) !== 0)) {
        state.fWinner = $impl.CheckLimit(state.fPoints[1],state.fPoints[2],state.fRules.fLimit);
        signalWinner.set(state.fWinner !== 0);
      };
    } else {
      if ((state.fWinner === 0) && (state.fRoundTotal >= state.fRules.fRoundLimit)) {
        if (state.fPoints[1] > state.fPoints[2]) {
          state.fWinner = 1}
         else if (state.fPoints[2] > state.fPoints[1]) state.fWinner = 2;
        signalWinner.set(state.fWinner !== 0);
      };
    };
  };
  this.PlayCard = function (state, card, signalBPrice, signalWinner, signalStockings) {
    var p = 0;
    var winner = 0;
    var i = 0;
    var stck = {};
    var cards = {};
    var snew = $mod.TSuit.$new();
    var lookForBPrice = false;
    var lookForWinner = false;
    function LookForBPriceAndWinner() {
      if (lookForBPrice && ($impl.CheckLimit(state.fTmpPts[1],state.fTmpPts[2],state.fRules.fCut) !== 0)) {
        state.fBPrice = $impl.CheckLimit(state.fTmpPts[1],state.fTmpPts[2],state.fRules.fCut);
        signalBPrice.set(true);
        lookForBPrice = false;
      };
      if (lookForWinner && ($impl.CheckLimit(state.fTmpPts[1],state.fTmpPts[2],state.fRules.fLimit) !== 0)) {
        state.fWinner = $impl.CheckLimit(state.fTmpPts[1],state.fTmpPts[2],state.fRules.fLimit);
        signalWinner.set(true);
        lookForWinner = false;
      };
    };
    var $with = state.fRounds[state.fRound];
    signalBPrice.set(false);
    signalWinner.set(false);
    signalStockings.set(false);
    lookForBPrice = state.fRules.fPointPlay && (state.fBPrice === 0) && (pas.StdUtils.MaxL(state.fTmpPts[1],state.fTmpPts[2]) < state.fRules.fCut);
    lookForWinner = state.fRules.fPointPlay && (state.fWinner === 0) && (pas.StdUtils.MaxL(state.fTmpPts[1],state.fTmpPts[2]) < state.fRules.fLimit);
    var $with1 = $with.fTricks[$with.fTrick];
    p = $with1.fLeading;
    while (($with1.fPlayed[p] !== 0) && ($mod.gNextPlayer[p] !== $with1.fLeading)) p = $mod.gNextPlayer[p];
    if ($with1.fPlayed[p] === 0) {
      $with1.fPlayed[p] = card;
    };
    for (i = 0; i <= 8; i++) {
      if (state.fHands[p][i] === card) {
        state.fHands[p][i] = 0;
        break;
      };
    };
    if (card in $mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump)) {
      stck = rtl.diffSet($mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump),rtl.createSet(card));
      i = $with.fTrick - 1;
      while ((i >= 0) && rtl.neSet(stck,{})) {
        stck = rtl.diffSet(stck,rtl.createSet($with.fTricks[i].fPlayed[p]));
        i = i - 1;
      };
      if (rtl.eqSet(stck,{})) {
        stck = rtl.refSet($mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump));
        i = 0;
        while ((i < $with.fSuits[p].fCount) && rtl.neSet(rtl.intersectSet($with.fSuits[p].fCalls[i].fCards,stck),stck)) i = i + 1;
        if (i >= $with.fSuits[p].fCount) {
          snew.fCards = rtl.refSet(stck);
          snew.fValue = 20;
          $mod.InsertSuit($with.fTrump,$mod.TSuit.$clone(snew),$with.fSuits[p]);
          signalStockings.set(true);
          if (lookForBPrice || lookForWinner) {
            state.fTmpPts[$mod.gTeamOf[p]] = state.fTmpPts[$mod.gTeamOf[p]] + (snew.fValue * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
            LookForBPriceAndWinner();
            state.fTmpPts[$mod.gTeamOf[p]] = state.fTmpPts[$mod.gTeamOf[p]] - (snew.fValue * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
          };
        };
      };
    };
    if ($mod.gNextPlayer[p] === $with.fTricks[$with.fTrick].fLeading) {
      if (!signalStockings.get() && ($with.fTrick === 1) && rtl.neSet($mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump),{}) && (lookForBPrice || lookForWinner)) {
        var $with2 = $with.fTricks[$with.fTrick - 1];
        stck = rtl.refSet($mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump));
        p = $with2.fLeading;
        do {
          cards = rtl.unionSet($mod.HandToCardSet(state.fHands[p].slice(0)),rtl.createSet($with2.fPlayed[p]));
          if (rtl.eqSet(rtl.intersectSet(stck,cards),stck)) {
            state.fTmpPts[$mod.gTeamOf[p]] = state.fTmpPts[$mod.gTeamOf[p]] + (20 * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
            LookForBPriceAndWinner();
            state.fTmpPts[$mod.gTeamOf[p]] = state.fTmpPts[$mod.gTeamOf[p]] - (20 * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
            if (signalBPrice.get() || signalWinner.get()) {
              i = 0;
              while ((i < $with.fSuits[p].fCount) && rtl.neSet(rtl.intersectSet($with.fSuits[p].fCalls[i].fCards,stck),stck)) i = i + 1;
              if (i >= $with.fSuits[p].fCount) {
                snew.fCards = rtl.refSet(stck);
                snew.fValue = 20;
                $mod.InsertSuit($with.fTrump,$mod.TSuit.$clone(snew),$with.fSuits[p]);
                signalStockings.set(true);
              };
            };
          };
          p = $mod.gNextPlayer[p];
        } while (!((p === $with2.fLeading) || signalStockings.get()));
      };
      winner = $mod.WinnerOfTrick($with.fTrump,$mod.TTrick.$clone($with.fTricks[$with.fTrick]));
      $with.fTrick = $with.fTrick + 1;
      $with.fTricks[$with.fTrick].fLeading = winner;
      if (state.fRules.fSuitsComeFirst && ($with.fTrick === 1) && $impl.EvalSuits(state,state.fRounds[state.fRound])) LookForBPriceAndWinner();
      state.fTmpPts[$mod.gTeamOf[winner]] = state.fTmpPts[$mod.gTeamOf[winner]] + ($mod.ValueOfTrick($with.fTrump,$mod.TTrick.$clone($with.fTricks[$with.fTrick - 1])) * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
      LookForBPriceAndWinner();
      if (!state.fRules.fSuitsComeFirst && ($with.fTrick === 1) && $impl.EvalSuits(state,state.fRounds[state.fRound])) LookForBPriceAndWinner();
    };
  };
  this.CallSuit = function (state, forPlayer, suit) {
    var snew = $mod.TSuit.$new();
    var stck = {};
    var curr = 0;
    var $with = state.fRounds[state.fRound];
    $with.fSuits[forPlayer].$assign(suit);
    stck = rtl.refSet($mod.Stockings($mod.TRules.$clone(state.fRules),$with.fTrump));
    if (rtl.neSet(stck,{})) {
      curr = 0;
      while ((curr < suit.fCount) && rtl.neSet(rtl.intersectSet(suit.fCalls[curr].fCards,stck),stck)) curr = curr + 1;
      if ((curr < suit.fCount) && rtl.neSet(suit.fCalls[curr].fCards,stck)) {
        snew.fCards = rtl.refSet(stck);
        snew.fValue = 20;
        $mod.InsertSuit($with.fTrump,$mod.TSuit.$clone(snew),$with.fSuits[forPlayer]);
      };
    };
  };
  this.ForfaitRound = function (state, player) {
    var p = 0;
    var w = 0;
    var i = rtl.arraySetLength(null,0,5);
    var trick = 0;
    var $with = state.fRounds[state.fRound];
    if ($with.fTrump === 0) $with.fTrump = 5;
    if ($with.fTrick === 0) {
      p = $mod.gNextPlayer[player];
      if ($with.fSuits[p].fCount <= 0) $mod.GetBestSuit($mod.TRules.$clone(state.fRules),$with.fTrump,state.fHands[p].slice(0),$with.fSuits[p]);
      p = $mod.gNextPlayer[$mod.gNextPlayer[p]];
      if ($with.fSuits[p].fCount <= 0) $mod.GetBestSuit($mod.TRules.$clone(state.fRules),$with.fTrump,state.fHands[p].slice(0),$with.fSuits[p]);
    };
    w = $mod.gTeamOf[$mod.gNextPlayer[player]];
    for (p = 1; p <= 4; p++) i[p] = 0;
    trick = $with.fTrick;
    while (trick < 9) {
      for (p = 1; p <= 4; p++) {
        if ($with.fTricks[trick].fPlayed[p] === 0) {
          while ((i[p] <= 8) && (state.fHands[p][i[p]] === 0)) i[p] = i[p] + 1;
          if (i[p] <= 8) {
            $with.fTricks[trick].fPlayed[p] = state.fHands[p][i[p]];
            state.fHands[p][i[p]] = 0;
          };
        };
      };
      trick = trick + 1;
      $with.fTricks[trick].fLeading = $mod.gNextPlayer[player];
      state.fTmpPts[w] = state.fTmpPts[w] + ($mod.ValueOfTrick($with.fTrump,$mod.TTrick.$clone($with.fTricks[trick - 1])) * $mod.FactorOfTrump($mod.TRules.$clone(state.fRules),$with.fTrump));
    };
    $with.fTrick = 9;
  };
  this.ForfaitJass = function (state, player) {
    var pts = rtl.arraySetLength(null,0,3);
    var matchBy = 0;
    var signal = false;
    pts[1] = 0;
    pts[2] = 0;
    while (!$mod.MatchFinished(state)) {
      $mod.ForfaitRound(state,player);
      $mod.ValueOfRound($mod.TRules.$clone(state.fRules),$mod.TRound.$clone(state.fRounds[state.fRound]),{get: function () {
          return pts;
        }, set: function (v) {
          pts = v;
        }},{get: function () {
          return matchBy;
        }, set: function (v) {
          matchBy = v;
        }});
      if (!$mod.MatchFinished(state)) {
        $mod.FinishRound(state,{get: function () {
            return pts;
          }, set: function (v) {
            pts = v;
          }},{get: function () {
            return matchBy;
          }, set: function (v) {
            matchBy = v;
          }},{get: function () {
            return signal;
          }, set: function (v) {
            signal = v;
          }},{get: function () {
            return signal;
          }, set: function (v) {
            signal = v;
          }});
        $mod.DealCards({p: state, get: function () {
            return this.p.fHands;
          }, set: function (v) {
            this.p.fHands = v;
          }});
        $mod.PrepareRound(state,5,0);
        pts[1] = 0;
        pts[2] = 0;
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
  this.InitSWSBase = function () {
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
    $mod.gTeamOf[0] = 0;
    $mod.gTeamOf[1] = 1;
    $mod.gTeamOf[2] = 2;
    $mod.gTeamOf[3] = 1;
    $mod.gTeamOf[4] = 2;
    $mod.gNextPlayer[0] = 0;
    $mod.gNextPlayer[1] = 2;
    $mod.gNextPlayer[2] = 3;
    $mod.gNextPlayer[3] = 4;
    $mod.gNextPlayer[4] = 1;
    $mod.gPrevPlayer[0] = 0;
    $mod.gPrevPlayer[1] = 4;
    $mod.gPrevPlayer[2] = 1;
    $mod.gPrevPlayer[3] = 2;
    $mod.gPrevPlayer[4] = 3;
    for (trump = 0; trump <= 6; trump++) for (prev = 0; prev <= 36; prev++) for (card = 0; card <= 36; card++) if (trump === 0) {
      $mod.gBetterCard[trump][prev][card] = false}
     else $mod.gBetterCard[trump][prev][card] = $mod.BetterCard(trump,prev,card);
    for (trump = 0; trump <= 6; trump++) for (card = 0; card <= 36; card++) if (trump === 0) {
      $mod.gValueOfCard[trump][card] = 0}
     else $mod.gValueOfCard[trump][card] = $mod.ValueOfCard(trump,card);
    $mod.gColourName[0] = "No Trump";
    $mod.gColourName[1] = "Schlle";
    $mod.gColourName[2] = "Schilte";
    $mod.gColourName[3] = "Rose";
    $mod.gColourName[4] = "ichle";
    $mod.gRankName[0] = "No Rank";
    $mod.gRankName[1] = "Schsi";
    $mod.gRankName[2] = "Sibni";
    $mod.gRankName[3] = "Achti";
    $mod.gRankName[4] = "Nni";
    $mod.gRankName[5] = "Zni";
    $mod.gRankName[6] = "Bueb";
    $mod.gRankName[7] = "Ober";
    $mod.gRankName[8] = "Knig";
    $mod.gRankName[9] = "Ass";
    $mod.gTrumpName[0] = $mod.gColourName[0];
    $mod.gTrumpName[1] = $mod.gColourName[1];
    $mod.gTrumpName[2] = $mod.gColourName[2];
    $mod.gTrumpName[3] = $mod.gColourName[3];
    $mod.gTrumpName[4] = $mod.gColourName[4];
    $mod.gTrumpName[5] = "Obnab";
    $mod.gTrumpName[6] = "Unnuf";
    for (i = 0; i <= 10; i++) {
      $mod.gRnd[i].fUsed = false;
    };
    $mod.gRnd[0].fUsed = true;
    $mod.gDealRnd = $mod.NewRnd("Verteilen");
    $impl.gGlobalRules.fPointPlay = true;
    $impl.gGlobalRules.fLimit = 2500;
    $impl.gGlobalRules.fCut = 1250;
    $impl.gGlobalRules.fRoundLimit = 12;
    $impl.gGlobalRules.fLooserBegins = true;
    $impl.gGlobalRules.fSuitsEnabled = true;
    $impl.gGlobalRules.fSuitAllFourEqs = true;
    $impl.gGlobalRules.fSuitCrossingOn = true;
    $impl.gGlobalRules.fSuitsComeFirst = true;
    $impl.gGlobalRules.fSuitsIncrement = 50;
    $impl.gGlobalRules.fMatchBonus = 100;
    $impl.gGlobalRules.fTrumpFactor[0] = 0;
    $impl.gGlobalRules.fTrumpFactor[1] = 2;
    $impl.gGlobalRules.fTrumpFactor[2] = 2;
    $impl.gGlobalRules.fTrumpFactor[4] = 1;
    $impl.gGlobalRules.fTrumpFactor[3] = 1;
    $impl.gGlobalRules.fTrumpFactor[5] = 3;
    $impl.gGlobalRules.fTrumpFactor[6] = 3;
    $mod.gOwnerInfo = "";
    $mod.gVersionInfo = "";
  };
  this.FreeSWSBase = function () {
  };
  $mod.$implcode = function () {
    $impl.gGlobalRules = $mod.TRules.$new();
    $impl.CheckLimit = function (ptsNS, ptsWE, limit) {
      var Result = 0;
      Result = 0;
      if (ptsNS > ptsWE) {
        if (ptsNS >= limit) Result = 1;
      } else if (ptsNS < ptsWE) {
        if (ptsWE >= limit) Result = 2;
      };
      return Result;
    };
    $impl.EvalSuits = function (state, round) {
      var Result = false;
      var p = 0;
      var best = 0;
      var pts = rtl.arraySetLength(null,0,3);
      Result = false;
      if (round.fTrump === 0) return Result;
      best = 0;
      p = round.fTricks[0].fLeading;
      do {
        if ((round.fSuits[p].fCount > 0) && $mod.BetterSuit(round.fTrump,round.fSuits[p],round.fSuits[best])) {
          best = p;
        };
        p = $mod.gNextPlayer[p];
      } while (!(p === round.fTricks[0].fLeading));
      if (best !== 0) {
        for (p = 1; p <= 4; p++) {
          if ($mod.gTeamOf[p] !== $mod.gTeamOf[best]) round.fSuits[p].fCount = 0;
        };
        $mod.ValueOfSuits($mod.TRules.$clone(state.fRules),$mod.TRound.$clone(round),{get: function () {
            return pts;
          }, set: function (v) {
            pts = v;
          }});
        state.fTmpPts[1] = state.fTmpPts[1] + pts[1];
        state.fTmpPts[2] = state.fTmpPts[2] + pts[2];
      };
      Result = best !== 0;
      return Result;
    };
  };
},["ShellWin","SysUtils"]);
rtl.module("SWSCmds",["System","SWSBase"],function () {
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
  this.cmdTrump = 2002;
  this.cmdShift = 2003;
  this.cmdPlay = 2004;
  this.cmdCard = 2005;
  this.cmdSuit = 2006;
  this.cmdCount = 2007;
  this.cmdForfaitRound = 2008;
  this.cmdForfaitJass = 2009;
  this.cmdBPrice = 2010;
  this.cmdWinner = 2011;
  this.cmdSay = 2020;
  this.cmdHelp = 9000;
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
    $r.addField("fPlayers",pas.SWSBase.$rtti["TPlayerSet"]);
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
    $r.addField("fPlayers",pas.SWSBase.$rtti["TPlayerSet"]);
  });
  this.$rtti.$Pointer("DisconnectCmd",{reftype: this.$rtti["DisconnectData"]});
  rtl.recNewT(this,"NewData",function () {
    this.fPlayer = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fRules = pas.SWSBase.TRules.$new();
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
    $r.addField("fRules",pas.SWSBase.$rtti["TRules"]);
    $mod.$rtti.$StaticArray("NewData.fTypes$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fTypes",$mod.$rtti["NewData.fTypes$a"]);
    $mod.$rtti.$StaticArray("NewData.fNames$a",{dims: [5], eltype: rtl.string});
    $r.addField("fNames",$mod.$rtti["NewData.fNames$a"]);
    $mod.$rtti.$StaticArray("NewData.fLevel$a",{dims: [5], eltype: rtl.longint});
    $r.addField("fLevel",$mod.$rtti["NewData.fLevel$a"]);
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
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
    this.$new = function () {
      var r = Object.create(this);
      r.fHands = rtl.arraySetLength(null,0,5,9);
      r.fPoints = rtl.arraySetLength(null,0,3);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fHands,b.fHands) && rtl.arrayEq(this.fPoints,b.fPoints);
    };
    this.$assign = function (s) {
      this.fHands = pas.SWSBase.THands$clone(s.fHands);
      this.fPoints = s.fPoints.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("DealData",{},this);
    $r.addField("fHands",pas.SWSBase.$rtti["THands"]);
    $r.addField("fPoints",pas.SWSBase.$rtti["TPoints"]);
  });
  this.$rtti.$Pointer("DealCmd",{reftype: this.$rtti["DealData"]});
  rtl.recNewT(this,"EditData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.fHands = rtl.arraySetLength(null,0,5,9);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.fHands,b.fHands);
    };
    this.$assign = function (s) {
      this.fHands = pas.SWSBase.THands$clone(s.fHands);
      return this;
    };
    var $r = $mod.$rtti.$Record("EditData",{},this);
    $r.addField("fHands",pas.SWSBase.$rtti["THands"]);
  });
  this.$rtti.$Pointer("EditCmd",{reftype: this.$rtti["EditData"]});
  rtl.recNewT(this,"TrumpData",function () {
    this.fPlayer = 0;
    this.fTrump = 0;
    this.$eq = function (b) {
      return (this.fPlayer === b.fPlayer) && (this.fTrump === b.fTrump);
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      this.fTrump = s.fTrump;
      return this;
    };
    var $r = $mod.$rtti.$Record("TrumpData",{},this);
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
    $r.addField("fTrump",pas.SWSBase.$rtti["TTrump"]);
  });
  this.$rtti.$Pointer("TrumpCmd",{reftype: this.$rtti["TrumpData"]});
  rtl.recNewT(this,"ShiftData",function () {
    this.fPlayer = 0;
    this.$eq = function (b) {
      return this.fPlayer === b.fPlayer;
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      return this;
    };
    var $r = $mod.$rtti.$Record("ShiftData",{},this);
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
  });
  this.$rtti.$Pointer("ShiftCmd",{reftype: this.$rtti["ShiftData"]});
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
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
    $r.addField("fCard",pas.SWSBase.$rtti["TCard"]);
  });
  this.$rtti.$Pointer("CardCmd",{reftype: this.$rtti["CardData"]});
  rtl.recNewT(this,"SuitData",function () {
    this.fPlayer = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fSuit = pas.SWSBase.TSuits.$new();
      return r;
    };
    this.$eq = function (b) {
      return (this.fPlayer === b.fPlayer) && this.fSuit.$eq(b.fSuit);
    };
    this.$assign = function (s) {
      this.fPlayer = s.fPlayer;
      this.fSuit.$assign(s.fSuit);
      return this;
    };
    var $r = $mod.$rtti.$Record("SuitData",{},this);
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
    $r.addField("fSuit",pas.SWSBase.$rtti["TSuits"]);
  });
  this.$rtti.$Pointer("SuitCmd",{reftype: this.$rtti["SuitData"]});
  rtl.recNewT(this,"PlayData",function () {
    this.fTrump = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTrick = pas.SWSBase.TTrick.$new();
      r.fHand = rtl.arraySetLength(null,0,9);
      r.fLegal = rtl.arraySetLength(null,0,9);
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
    $r.addField("fTrump",pas.SWSBase.$rtti["TTrump"]);
    $r.addField("fTrick",pas.SWSBase.$rtti["TTrick"]);
    $r.addField("fHand",pas.SWSBase.$rtti["THand"]);
    $r.addField("fLegal",pas.SWSBase.$rtti["THand"]);
  });
  this.$rtti.$Pointer("PlayCmd",{reftype: this.$rtti["PlayData"]});
  rtl.recNewT(this,"CountData",function () {
    this.fMatchBy = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fPoints = rtl.arraySetLength(null,0,3);
      r.fSuitPts = rtl.arraySetLength(null,0,3);
      return r;
    };
    this.$eq = function (b) {
      return (this.fMatchBy === b.fMatchBy) && rtl.arrayEq(this.fPoints,b.fPoints) && rtl.arrayEq(this.fSuitPts,b.fSuitPts);
    };
    this.$assign = function (s) {
      this.fMatchBy = s.fMatchBy;
      this.fPoints = s.fPoints.slice(0);
      this.fSuitPts = s.fSuitPts.slice(0);
      return this;
    };
    var $r = $mod.$rtti.$Record("CountData",{},this);
    $r.addField("fMatchBy",pas.SWSBase.$rtti["TTeam"]);
    $r.addField("fPoints",pas.SWSBase.$rtti["TPoints"]);
    $r.addField("fSuitPts",pas.SWSBase.$rtti["TPoints"]);
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
    $r.addField("fPlayer",pas.SWSBase.$rtti["TPlayer"]);
  });
  this.$rtti.$Pointer("ForfaitCmd",{reftype: this.$rtti["ForfaitData"]});
  rtl.recNewT(this,"InfoData",function () {
    this.fTeam = 0;
    this.$eq = function (b) {
      return this.fTeam === b.fTeam;
    };
    this.$assign = function (s) {
      this.fTeam = s.fTeam;
      return this;
    };
    var $r = $mod.$rtti.$Record("InfoData",{},this);
    $r.addField("fTeam",pas.SWSBase.$rtti["TTeam"]);
  });
  this.$rtti.$Pointer("InfoCmd",{reftype: this.$rtti["InfoData"]});
  this.MOODINFO = {"0": "moodFurious", moodFurious: 0, "1": "moodAngry", moodAngry: 1, "2": "moodCalm", moodCalm: 2, "3": "moodHappy", moodHappy: 3, "4": "moodOverjoyed", moodOverjoyed: 4};
  this.$rtti.$Enum("MOODINFO",{minvalue: 0, maxvalue: 4, ordtype: 1, enumtype: this.MOODINFO});
  rtl.recNewT(this,"SayData",function () {
    this.fFrom = 0;
    this.fMood = 0;
    this.fText = "";
    this.fIcon = 0;
    this.fSound = 0;
    this.$new = function () {
      var r = Object.create(this);
      r.fTo = {};
      return r;
    };
    this.$eq = function (b) {
      return (this.fFrom === b.fFrom) && rtl.eqSet(this.fTo,b.fTo) && (this.fMood === b.fMood) && (this.fText === b.fText) && (this.fIcon === b.fIcon) && (this.fSound === b.fSound);
    };
    this.$assign = function (s) {
      this.fFrom = s.fFrom;
      this.fTo = rtl.refSet(s.fTo);
      this.fMood = s.fMood;
      this.fText = s.fText;
      this.fIcon = s.fIcon;
      this.fSound = s.fSound;
      return this;
    };
    var $r = $mod.$rtti.$Record("SayData",{},this);
    $r.addField("fFrom",pas.SWSBase.$rtti["TPlayer"]);
    $r.addField("fTo",pas.SWSBase.$rtti["TPlayerSet"]);
    $r.addField("fMood",$mod.$rtti["MOODINFO"]);
    $r.addField("fText",rtl.string);
    $r.addField("fIcon",rtl.longint);
    $r.addField("fSound",rtl.longint);
  });
  this.$rtti.$Pointer("SayCmd",{reftype: this.$rtti["SayData"]});
  this.InitCommand = function (aCmd, cmdID) {
    var pNew = null;
    var pDeal = null;
    var pEdit = null;
    var pTrump = null;
    var pCard = null;
    var pSuit = null;
    var pPlay = null;
    var pCount = null;
    var pInfo = null;
    var pShift = null;
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
      pTrump = $mod.TrumpData.$new();
      aCmd.fCData = pTrump;
    } else if ($tmp === 2003) {
      pShift = $mod.ShiftData.$new();
      aCmd.fCData = pShift;
    } else if ($tmp === 2005) {
      pCard = $mod.CardData.$new();
      aCmd.fCData = pCard;
    } else if ($tmp === 2006) {
      pSuit = $mod.SuitData.$new();
      aCmd.fCData = pSuit;
    } else if ($tmp === 2004) {
      pPlay = $mod.PlayData.$new();
      aCmd.fCData = pPlay;
    } else if ($tmp === 2007) {
      pCount = $mod.CountData.$new();
      aCmd.fCData = pCount;
    } else if (($tmp === 2011) || ($tmp === 2010)) {
      pInfo = $mod.InfoData.$new();
      aCmd.fCData = pInfo;
    };
  };
  this.FreeCommand = function (aCmd) {
    aCmd.fCData = null;
    aCmd.fCmdID = 0;
  };
});
rtl.module("SWSPlay",["System","SWSBase","SWSCmds"],function () {
  "use strict";
  var $mod = this;
  this.kHumanJasser = 0;
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
    this.HandleRequest = function (aReq, answer) {
      pas.SWSCmds.InitCommand(answer,0);
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
  this.DeclareHandler = function (handler, name) {
  };
});
rtl.module("Jassers",["System","SWSBase","SWSCmds","SWSPlay"],function () {
  "use strict";
  var $mod = this;
  rtl.createClass(this,"TProtoJasser",pas.SWSPlay.TJassHandler,function () {
    this.$init = function () {
      pas.SWSPlay.TJassHandler.$init.call(this);
      this.fRules = pas.SWSBase.TRules.$new();
      this.fMyHand = rtl.arraySetLength(null,0,9);
      this.fMyName = "";
      this.fSayMood = 0;
      this.fSayIcon = 0;
    };
    this.$final = function () {
      this.fRules = undefined;
      this.fMyHand = undefined;
      pas.SWSPlay.TJassHandler.$final.call(this);
    };
    this.IJassHandler$1 = function (player) {
      pas.SWSPlay.TJassHandler.IJassHandler.call(this,player);
      pas.SWSBase.GetGlobalRules(this.fRules);
      return this;
    };
    this.NotifyCommand = function (aCmd) {
      var c = 0;
      pas.SWSPlay.TJassHandler.NotifyCommand.call(this,pas.SWSCmds.TCommand.$clone(aCmd));
      var $tmp = aCmd.fCmdID;
      if ($tmp === 1100) {
        this.fRules.$assign(aCmd.fCData.fRules);
        this.fMyName = aCmd.fCData.fNames[this.fPlayer];
      } else if ($tmp === 2000) {
        this.fMyHand = aCmd.fCData.fHands[this.fPlayer].slice(0);
        pas.SWSBase.SortHand({p: this, get: function () {
            return this.p.fMyHand;
          }, set: function (v) {
            this.p.fMyHand = v;
          }});
      } else if ($tmp === 2001) {
        this.fMyHand = aCmd.fCData.fHands[this.fPlayer].slice(0);
        pas.SWSBase.SortHand({p: this, get: function () {
            return this.p.fMyHand;
          }, set: function (v) {
            this.p.fMyHand = v;
          }});
      } else if ($tmp === 2005) if (aCmd.fCData.fPlayer === this.fPlayer) for (c = 0; c <= 8; c++) if (this.fMyHand[c] === aCmd.fCData.fCard) this.fMyHand[c] = 0;
    };
  });
});
rtl.module("Dialogs",["System"],function () {
  "use strict";
  var $mod = this;
  this.ShowMessage = function (s) {
    pas.System.Writeln(s);
  };
});
rtl.module("ResUtils",["System"],function () {
  "use strict";
  var $mod = this;
});
rtl.module("SWSFile",["System"],function () {
  "use strict";
  var $mod = this;
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
rtl.module("RalphJss",["System","StdUtils","SWSBase","SWSCmds","SWSPlay","Jassers"],function () {
  "use strict";
  var $mod = this;
  var $impl = $mod.$impl;
  rtl.recNewT(this,"TPortRecord0",function () {
    this.value = 0.0;
    this.card = 0;
    this.$eq = function (b) {
      return (this.value === b.value) && (this.card === b.card);
    };
    this.$assign = function (s) {
      this.value = s.value;
      this.card = s.card;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord0",{},this);
    $r.addField("value",pas.System.$rtti["Real"]);
    $r.addField("card",pas.SWSBase.$rtti["TCard"]);
  });
  rtl.recNewT(this,"TPortRecord1",function () {
    this.value = 0;
    this.card = 0;
    this.$eq = function (b) {
      return (this.value === b.value) && (this.card === b.card);
    };
    this.$assign = function (s) {
      this.value = s.value;
      this.card = s.card;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord1",{},this);
    $r.addField("value",rtl.longint);
    $r.addField("card",rtl.longint);
  });
  rtl.recNewT(this,"TPortRecord2",function () {
    this.expect = 0.0;
    this.count = 0;
    this.$eq = function (b) {
      return (this.expect === b.expect) && (this.count === b.count);
    };
    this.$assign = function (s) {
      this.expect = s.expect;
      this.count = s.count;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord2",{},this);
    $r.addField("expect",pas.System.$rtti["Real"]);
    $r.addField("count",rtl.longint);
  });
  rtl.recNewT(this,"TPortRecord3",function () {
    this.expect = 0.0;
    this.count = 0;
    this.$eq = function (b) {
      return (this.expect === b.expect) && (this.count === b.count);
    };
    this.$assign = function (s) {
      this.expect = s.expect;
      this.count = s.count;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord3",{},this);
    $r.addField("expect",pas.System.$rtti["Real"]);
    $r.addField("count",rtl.longint);
  });
  rtl.recNewT(this,"TPortRecord4",function () {
    this.expect = 0.0;
    this.count = 0;
    this.$eq = function (b) {
      return (this.expect === b.expect) && (this.count === b.count);
    };
    this.$assign = function (s) {
      this.expect = s.expect;
      this.count = s.count;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord4",{},this);
    $r.addField("expect",pas.System.$rtti["Real"]);
    $r.addField("count",rtl.longint);
  });
  rtl.recNewT(this,"TPortRecord5",function () {
    this.expect = 0.0;
    this.count = 0;
    this.$eq = function (b) {
      return (this.expect === b.expect) && (this.count === b.count);
    };
    this.$assign = function (s) {
      this.expect = s.expect;
      this.count = s.count;
      return this;
    };
    var $r = $mod.$rtti.$Record("TPortRecord5",{},this);
    $r.addField("expect",pas.System.$rtti["Real"]);
    $r.addField("count",rtl.longint);
  });
  this.$rtti.$DynArray("TPortData",{eltype: rtl.byte});
  this.PortData = [];
  this.kRalphJassRsrc = 7000;
  this.HashTableLen = 0;
  this.$rtti.$StaticArray("TColorRange",{dims: [5], eltype: rtl.boolean});
  this.$rtti.$StaticArray("Tsimu",{dims: [5], eltype: rtl.longint});
  this.TAllCards$clone = function (a) {
    var b = [];
    b.length = 4;
    for (var c = 0; c < 4; c++) b[c] = rtl.refSet(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("TAllCards",{dims: [4], eltype: pas.SWSBase.$rtti["TCardSet"]});
  this.$rtti.$StaticArray("TPlayColour",{dims: [5], eltype: pas.SWSBase.$rtti["TColour"]});
  this.TPlayColInt$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("TPlayColInt",{dims: [5,5], eltype: rtl.longint});
  this.$rtti.$StaticArray("TColourLead",{dims: [5], eltype: rtl.boolean});
  this.$rtti.$StaticArray("TPlayedCards",{dims: [36], eltype: pas.SWSBase.$rtti["TCard"]});
  this.$rtti.$StaticArray("TNrTricksTaken",{dims: [3], eltype: rtl.longint});
  this.TBoeck$clone = function (a) {
    var b = [];
    b.length = 4096;
    for (var c = 0; c < 4096; c++) b[c] = $mod.TPortRecord0.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("TBoeck",{dims: [4096], eltype: this.$rtti["TPortRecord0"]});
  this.TAnzug$clone = function (a) {
    var b = [];
    b.length = 2;
    for (var c = 0; c < 2; c++) {
      var d = b[c] = [];
      d.length = 1024;
      var e = a[c];
      for (var f = 0; f < 1024; f++) d[f] = $mod.TPortRecord1.$clone(e[f]);
    };
    return b;
  };
  this.$rtti.$StaticArray("TAnzug",{dims: [2,1024], eltype: this.$rtti["TPortRecord1"]});
  this.TTrumpPoints$clone = function (a) {
    var b = [];
    b.length = 2;
    for (var c = 0; c < 2; c++) {
      var d = b[c] = [];
      d.length = 640;
      var e = a[c];
      for (var f = 0; f < 640; f++) d[f] = $mod.TPortRecord2.$clone(e[f]);
    };
    return b;
  };
  this.$rtti.$StaticArray("TTrumpPoints",{dims: [2,640], eltype: this.$rtti["TPortRecord2"]});
  this.TWyssPoints$clone = function (a) {
    var b = [];
    b.length = 2;
    for (var c = 0; c < 2; c++) {
      var d = b[c] = [];
      d.length = 38;
      var e = a[c];
      for (var f = 0; f < 38; f++) d[f] = $mod.TPortRecord3.$clone(e[f]);
    };
    return b;
  };
  this.$rtti.$StaticArray("TWyssPoints",{dims: [2,38], eltype: this.$rtti["TPortRecord3"]});
  rtl.recNewT(this,"TSchiebPoints",function () {
    this.cards$a$clone = function (a) {
      var b = [];
      b.length = 1024;
      for (var c = 0; c < 1024; c++) b[c] = $mod.TPortRecord4.$clone(a[c]);
      return b;
    };
    this.wyss$a$clone = function (a) {
      var b = [];
      b.length = 38;
      for (var c = 0; c < 38; c++) b[c] = $mod.TPortRecord5.$clone(a[c]);
      return b;
    };
    this.$new = function () {
      var r = Object.create(this);
      r.cards = rtl.arraySetLength(null,$mod.TPortRecord4,1024);
      r.wyss = rtl.arraySetLength(null,$mod.TPortRecord5,38);
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.cards,b.cards) && rtl.arrayEq(this.wyss,b.wyss);
    };
    this.$assign = function (s) {
      this.cards = this.cards$a$clone(s.cards);
      this.wyss = this.wyss$a$clone(s.wyss);
      return this;
    };
    var $r = $mod.$rtti.$Record("TSchiebPoints",{},this);
    $mod.$rtti.$StaticArray("TSchiebPoints.cards$a",{dims: [1024], eltype: $mod.$rtti["TPortRecord4"]});
    $r.addField("cards",$mod.$rtti["TSchiebPoints.cards$a"]);
    $mod.$rtti.$StaticArray("TSchiebPoints.wyss$a",{dims: [38], eltype: $mod.$rtti["TPortRecord5"]});
    $r.addField("wyss",$mod.$rtti["TSchiebPoints.wyss$a"]);
  });
  rtl.recNewT(this,"TFileData",function () {
    this.$new = function () {
      var r = Object.create(this);
      r.Trumpf = rtl.arraySetLength(null,$mod.TPortRecord2,2,640);
      r.Wyss = rtl.arraySetLength(null,$mod.TPortRecord3,2,38);
      r.Schieben = $mod.TSchiebPoints.$new();
      return r;
    };
    this.$eq = function (b) {
      return rtl.arrayEq(this.Trumpf,b.Trumpf) && rtl.arrayEq(this.Wyss,b.Wyss) && this.Schieben.$eq(b.Schieben);
    };
    this.$assign = function (s) {
      this.Trumpf = $mod.TTrumpPoints$clone(s.Trumpf);
      this.Wyss = $mod.TWyssPoints$clone(s.Wyss);
      this.Schieben.$assign(s.Schieben);
      return this;
    };
    var $r = $mod.$rtti.$Record("TFileData",{},this);
    $r.addField("Trumpf",$mod.$rtti["TTrumpPoints"]);
    $r.addField("Wyss",$mod.$rtti["TWyssPoints"]);
    $r.addField("Schieben",$mod.$rtti["TSchiebPoints"]);
  });
  rtl.createClass(this,"TMyJasser",pas.Jassers.TProtoJasser,function () {
    this.$init = function () {
      pas.Jassers.TProtoJasser.$init.call(this);
      this.fTrump = 0;
      this.fShifted = false;
      this.fTrumpPlayer = 0;
      this.fTrick = pas.SWSBase.TTrick.$new();
      this.fColorLead = rtl.arraySetLength(null,false,5);
      this.fMyView = rtl.arraySetLength(null,0,4);
      this.fProbableView = rtl.arraySetLength(null,0,4);
      this.fWantColor = rtl.arraySetLength(null,0,5);
      this.fHasAtLeast = rtl.arraySetLength(null,0,5,5);
      this.fTricksTaken = rtl.arraySetLength(null,0,3);
      this.fcount = 0;
      this.fPoints = rtl.arraySetLength(null,0,3);
      this.fSuitMask = rtl.arraySetLength(null,0,4);
    };
    this.$final = function () {
      this.fTrick = undefined;
      this.fColorLead = undefined;
      this.fMyView = undefined;
      this.fProbableView = undefined;
      this.fWantColor = undefined;
      this.fHasAtLeast = undefined;
      this.fTricksTaken = undefined;
      this.fPoints = undefined;
      this.fSuitMask = undefined;
      pas.Jassers.TProtoJasser.$final.call(this);
    };
    this.NewInstance = function (player) {
      var Result = null;
      var aGrumpyJasser = null;
      aGrumpyJasser = $mod.TMyJasser.$create("IJassHandler$2",[player]);
      Result = aGrumpyJasser;
      return Result;
    };
    this.IJassHandler$2 = function (player) {
      pas.Jassers.TProtoJasser.IJassHandler$1.call(this,player);
      return this;
    };
    this.Edit = function () {
      var line = "";
      var ident = "";
      var index = 0;
      var depth = 0;
    };
    this.Free$1 = function () {
      pas.SWSPlay.TJassHandler.Free$1.call(this);
    };
    var NextCard$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
      return b;
    };
    this.HandleRequest = function (aReq, answer) {
      var $Self = this;
      var playC = null;
      var suitC = null;
      var i = 0;
      var tempBestWyss = 0;
      var myhand = rtl.arraySetLength(null,0,9);
      var mylegal = rtl.arraySetLength(null,0,9);
      var best = 0;
      var found = 0;
      var didfind = false;
      function BestPlay(countstich, depth, NewTrick) {
        var Result = false;
        var allcards = 0;
        var minvalue = 0;
        var maxvalue = 0;
        var ingame = 0;
        var points = 0;
        var Expect = rtl.arraySetLength(null,0,9);
        var best = 0;
        var totalcount = 0;
        var sample = 0;
        var Allhands = rtl.arraySetLength(null,0,5,9);
        var MaxIndex = 0;
        var NrCardsLeft = rtl.arraySetLength(null,0,5);
        var player = 0;
        var winner = 0;
        var fCardsInGame = {};
        var NextCard = rtl.arraySetLength(null,0,5,9);
        var AdjDown = rtl.arraySetLength(null,0,37);
        var AdjUp = rtl.arraySetLength(null,0,37);
        var colors = 0;
        var lastcard = 0;
        function FindExpect(alpha, beta, ingame, points, leadcolor, stich, stichplayer, player) {
          var Result = 0;
          var legal = rtl.arraySetLength(null,0,9);
          var i = 0;
          var handmax = 0;
          var best = 0;
          var expect = 0;
          var nextplayer = 0;
          var winner = 0;
          var who = 0;
          var lastwinner = 0;
          var winteam = 0;
          var thiscard = 0;
          var lastcard = 0;
          var fillcard = 0;
          function MyLegalHand(hand) {
            var i = 0;
            var j = 0;
            var none = false;
            var thisColor = 0;
            legal = hand.get().slice(0);
            if (stich !== 0) {
              none = true;
              i = handmax;
              if ($Self.fTrump < 5) {
                if ($Self.fTrump === leadcolor) {
                  do {
                    if (pas.SWSBase.gColourOf[hand.get()[i]] === leadcolor) {
                      none = none && (pas.SWSBase.gCardOf[$Self.fTrump][6] === hand.get()[i])}
                     else legal[i] = 0;
                    i -= 1;
                  } while (!(i < 0));
                } else if (pas.SWSBase.gColourOf[stich] === $Self.fTrump) {
                  do {
                    thisColor = pas.SWSBase.gColourOf[hand.get()[i]];
                    if (thisColor === leadcolor) {
                      none = false}
                     else if ((thisColor !== $Self.fTrump) || $mod.CardBetter[hand.get()[i]][stich]) legal[i] = 0;
                    i -= 1;
                  } while (!(i < 0));
                } else {
                  do {
                    thisColor = pas.SWSBase.gColourOf[hand.get()[i]];
                    if (thisColor === leadcolor) {
                      none = false}
                     else if (thisColor !== $Self.fTrump) legal[i] = 0;
                    i -= 1;
                  } while (!(i < 0));
                };
              } else {
                do {
                  if (pas.SWSBase.gColourOf[hand.get()[i]] === leadcolor) {
                    none = false}
                   else legal[i] = 0;
                  i -= 1;
                } while (!(i < 0));
              };
              if (none) legal = hand.get().slice(0);
            };
            if (countstich) {
              i = handmax;
              while (i > 0) {
                j = i - 1;
                while (j >= 0) {
                  if (AdjUp[hand.get()[i]] === hand.get()[j]) {
                    legal[j] = 0}
                   else if (AdjUp[hand.get()[j]] === hand.get()[i]) legal[i] = 0;
                  j -= 1;
                };
                i -= 1;
              };
            };
          };
          if (countstich) {
            if (alpha < -ingame) alpha = -ingame;
            if (beta > ingame) beta = ingame;
            if (($Self.fTrump >= 5) && (stich !== 0) && (AdjUp[stich] === 0)) {
              if (pas.SWSBase.gTeamOf[stichplayer] === pas.SWSBase.gTeamOf[player]) {
                if ((-ingame + 1) >= beta) alpha = -ingame + 1;
              } else {
                if (alpha >= (ingame - 1)) beta = ingame - 1;
              };
            };
          } else {
            if (alpha < (-ingame - 100)) alpha = -ingame - 100;
            if (beta > (ingame + 100)) beta = ingame + 100;
            if ((alpha < -ingame) && ($Self.fTricksTaken[pas.SWSBase.gTeamOf[player]] > 0)) alpha = -ingame;
            if ((beta > ingame) && ($Self.fTricksTaken[3 - pas.SWSBase.gTeamOf[player]] > 0)) beta = ingame;
          };
          best = alpha;
          if (best < beta) {
            NrCardsLeft[player] = NrCardsLeft[player] - 1;
            handmax = NrCardsLeft[player];
            fillcard = Allhands[player][handmax];
            nextplayer = pas.SWSBase.gNextPlayer[player];
            MyLegalHand({a: player, p: Allhands, get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }});
            for (var $l = handmax; $l >= 0; $l--) {
              i = $l;
              thiscard = legal[i];
              if (thiscard !== 0) {
                Allhands[player][i] = fillcard;
                if (stich === 0) {
                  expect = -FindExpect(-beta,-best,ingame,$mod.CardValues[thiscard],pas.SWSBase.gColourOf[thiscard],thiscard,player,nextplayer);
                } else if (handmax === NrCardsLeft[nextplayer]) {
                  if ($mod.CardBetter[stich][thiscard]) {
                    winner = player}
                   else winner = stichplayer;
                  winteam = pas.SWSBase.gTeamOf[winner];
                  if (handmax === 1) {
                    who = winner;
                    lastcard = 0;
                    do {
                      if ($mod.CardBetter[lastcard][Allhands[who][0]]) {
                        lastcard = Allhands[who][0];
                        lastwinner = who;
                      };
                      who = pas.SWSBase.gNextPlayer[who];
                    } while (!(who === winner));
                    if (countstich) {
                      if (pas.SWSBase.gTeamOf[lastwinner] === winteam) {
                        expect = 2}
                       else expect = 0;
                    } else if (pas.SWSBase.gTeamOf[lastwinner] === winteam) {
                      expect = ingame;
                      if ($Self.fTricksTaken[winteam] === 7) expect = expect + 100;
                    } else {
                      expect = points + $mod.CardValues[thiscard];
                      expect = (expect + expect) - ingame;
                    };
                    if (winteam !== pas.SWSBase.gTeamOf[player]) expect = -expect;
                  } else {
                    $Self.fTricksTaken[winteam] = $Self.fTricksTaken[winteam] + 1;
                    if (countstich) {
                      expect = 1}
                     else expect = points + $mod.CardValues[thiscard];
                    if (winteam === pas.SWSBase.gTeamOf[player]) {
                      expect = expect + FindExpect(best - expect,beta - expect,ingame - expect,0,0,0,0,winner);
                    } else {
                      expect = -expect - FindExpect(-beta - expect,-best - expect,ingame - expect,0,0,0,0,winner);
                    };
                    $Self.fTricksTaken[winteam] = $Self.fTricksTaken[winteam] - 1;
                  };
                } else {
                  expect = points + $mod.CardValues[thiscard];
                  if ($mod.CardBetter[stich][thiscard]) {
                    expect = -FindExpect(-beta,-best,ingame,expect,leadcolor,thiscard,player,nextplayer);
                  } else {
                    expect = -FindExpect(-beta,-best,ingame,expect,leadcolor,stich,stichplayer,nextplayer);
                  };
                };
                Allhands[player][i] = thiscard;
                if (expect > best) {
                  best = expect;
                  if (best >= beta) break;
                };
              };
            };
            NrCardsLeft[player] = NrCardsLeft[player] + 1;
            if (best < alpha) best = alpha;
            if (best > beta) best = beta;
          };
          Result = best;
          return Result;
        };
        function ComputeValue(points, leadcolor, stich, stichplayer) {
          var who2 = 0;
          var winner = 0;
          var winner2 = 0;
          var nextplayer = 0;
          var winteam = 0;
          var allcards = 0;
          var j = 0;
          var lastcard = 0;
          var temp = 0;
          var handmax = 0;
          var thiscard = 0;
          var fillcard = 0;
          var newstich = 0;
          NrCardsLeft[$Self.fPlayer] = NrCardsLeft[$Self.fPlayer] - 1;
          handmax = NrCardsLeft[$Self.fPlayer];
          fillcard = Allhands[$Self.fPlayer][handmax];
          nextplayer = pas.SWSBase.gNextPlayer[$Self.fPlayer];
          for (allcards = 0; allcards <= 8; allcards++) {
            thiscard = mylegal[allcards];
            if (thiscard !== 0) {
              j = 0;
              while (Allhands[$Self.fPlayer][j] !== thiscard) j += 1;
              Allhands[$Self.fPlayer][j] = fillcard;
              if ($mod.CardBetter[stich][thiscard]) {
                newstich = thiscard;
                winner = $Self.fPlayer;
                if (stich === 0) leadcolor = pas.SWSBase.gColourOf[thiscard];
              } else {
                newstich = stich;
                winner = stichplayer;
              };
              if (handmax === NrCardsLeft[nextplayer]) {
                winteam = pas.SWSBase.gTeamOf[winner];
                if (handmax === 1) {
                  who2 = winner;
                  lastcard = 0;
                  do {
                    if ($mod.CardBetter[lastcard][Allhands[who2][0]]) {
                      lastcard = Allhands[who2][0];
                      winner2 = who2;
                    };
                    who2 = pas.SWSBase.gNextPlayer[who2];
                  } while (!(who2 === winner));
                  if (countstich) {
                    if (pas.SWSBase.gTeamOf[winner2] === winteam) {
                      temp = 2}
                     else temp = 0;
                  } else if (pas.SWSBase.gTeamOf[winner2] === winteam) {
                    temp = ingame;
                    if ($Self.fTricksTaken[winteam] === 7) temp = temp + 100;
                  } else {
                    temp = points + $mod.CardValues[thiscard];
                    temp = (temp + temp) - ingame;
                  };
                  if (winteam !== pas.SWSBase.gTeamOf[$Self.fPlayer]) temp = -temp;
                } else {
                  $Self.fTricksTaken[winteam] = $Self.fTricksTaken[winteam] + 1;
                  if (countstich) {
                    temp = 1}
                   else temp = points + $mod.CardValues[thiscard];
                  if (winteam === pas.SWSBase.gTeamOf[$Self.fPlayer]) {
                    temp = temp + FindExpect(minvalue - temp,maxvalue - temp,ingame - temp,0,0,0,0,winner);
                  } else {
                    temp = -temp - FindExpect(-maxvalue - temp,-minvalue - temp,ingame - temp,0,0,0,0,winner);
                  };
                  $Self.fTricksTaken[winteam] = $Self.fTricksTaken[winteam] - 1;
                };
                Expect[allcards] = Expect[allcards] + temp;
              } else {
                temp = points + $mod.CardValues[thiscard];
                Expect[allcards] = Expect[allcards] - FindExpect(-maxvalue,-minvalue,ingame,temp,leadcolor,newstich,winner,nextplayer);
              };
              Allhands[$Self.fPlayer][j] = thiscard;
            };
          };
          NrCardsLeft[$Self.fPlayer] = NrCardsLeft[$Self.fPlayer] + 1;
        };
        function Distribute(Cards, points, leadcolor, stich, stichplayer) {
          var allcards = 0;
          var i = 0;
          var n = 0;
          var k = 0;
          var selection = 0;
          var val = 0;
          var check = 0;
          var where = 0;
          var c1 = 0;
          var c2 = 0;
          var c3 = 0;
          var who1 = 0;
          var who2 = 0;
          var who3 = 0;
          var Selected1 = rtl.arraySetLength(null,0,36);
          var List1 = rtl.arraySetLength(null,0,36);
          var origneed1 = 0;
          var count1 = 0;
          var origneed2 = 0;
          var needed2 = 0;
          var count2 = 0;
          var origneed3 = 0;
          var binTotal = 0;
          var Total = rtl.arraySetLength(null,0,8);
          var Possible = rtl.arraySetLength(null,0,36);
          var ok = false;
          who2 = pas.SWSBase.gNextPlayer[$Self.fPlayer];
          who1 = pas.SWSBase.gNextPlayer[who2];
          who3 = pas.SWSBase.gNextPlayer[who1];
          origneed1 = NrCardsLeft[who1];
          origneed2 = NrCardsLeft[who2];
          origneed3 = NrCardsLeft[who3];
          for (i = 0; i <= 7; i++) Total[i] = 0;
          for (allcards = 1; allcards <= 36; allcards++) {
            count1 = 0;
            if (allcards in Cards.get()[who1 - 1]) count1 = count1 + 1;
            if (allcards in Cards.get()[who2 - 1]) count1 = count1 + 2;
            if (allcards in Cards.get()[who3 - 1]) count1 = count1 + 4;
            Total[count1] = Total[count1] + 1;
            Possible[allcards - 1] = count1;
          };
          for (i = 0; i <= 8; i++) {
            Allhands[who1][i] = 0;
            Allhands[who2][i] = 0;
            Allhands[who3][i] = 0;
          };
          origneed1 = origneed1 - Total[1];
          origneed2 = origneed2 - Total[2];
          origneed3 = origneed3 - Total[4];
          if ((origneed1 + origneed2 + origneed3) === (Total[3] + Total[5] + Total[6] + Total[7])) {
            count1 = 0;
            for (allcards = 1; allcards <= 36; allcards++) if ((Possible[allcards - 1] === 3) || (Possible[allcards - 1] === 5) || (Possible[allcards - 1] === 7)) {
              List1[count1] = allcards;
              count1 += 1;
            };
            for (var $l = 0, $end = origneed1 - 1; $l <= $end; $l++) {
              allcards = $l;
              Selected1[allcards] = allcards;
              i = List1[allcards];
              Total[Possible[i - 1]] -= 1;
              Possible[i - 1] = Possible[i - 1] + 8;
            };
            do {
              ok = true;
              if (ok) {
                needed2 = origneed2 - Total[3];
                if ((needed2 >= 0) && (origneed3 >= Total[5])) {
                  count2 = Total[6] + Total[7];
                  binTotal = $mod.bin[count2][needed2];
                  selection = 0;
                  while ((sample - totalcount) < (binTotal - selection)) {
                    selection = (selection + sample) - totalcount;
                    totalcount = 0;
                    c1 = 0;
                    c2 = 0;
                    c3 = 0;
                    val = selection;
                    k = needed2 - 1;
                    n = count2 - 1;
                    for (allcards = 1; allcards <= 36; allcards++) {
                      var $tmp = Possible[allcards - 1];
                      if (($tmp === 1) || ($tmp === 11) || ($tmp === 13) || ($tmp === 15)) {
                        Allhands[who1][c1] = allcards;
                        c1 += 1;
                      } else if (($tmp === 2) || ($tmp === 3)) {
                        Allhands[who2][c2] = allcards;
                        c2 += 1;
                      } else if (($tmp === 4) || ($tmp === 5)) {
                        Allhands[who3][c3] = allcards;
                        c3 += 1;
                      } else if (($tmp === 6) || ($tmp === 7)) {
                        check = 0;
                        if (k >= 0) check = $mod.bin[n][k];
                        if (val < check) {
                          Allhands[who2][c2] = allcards;
                          c2 += 1;
                          k -= 1;
                        } else {
                          Allhands[who3][c3] = allcards;
                          c3 += 1;
                          val = val - check;
                        };
                        n -= 1;
                      };
                    };
                    ComputeValue(points,leadcolor,stich,stichplayer);
                    selection += 1;
                  };
                  totalcount = (totalcount + binTotal) - selection;
                };
              };
              where = origneed1;
              do {
                where -= 1;
                if (where >= 0) {
                  allcards = List1[Selected1[where]];
                  Possible[allcards - 1] = Possible[allcards - 1] - 8;
                  Total[Possible[allcards - 1]] += 1;
                };
              } while (!((where < 0) || (((Selected1[where] + origneed1) - where) < count1)));
              if (where >= 0) {
                i = Selected1[where];
                while (where < origneed1) {
                  i += 1;
                  Selected1[where] = i;
                  allcards = List1[i];
                  Total[Possible[allcards - 1]] -= 1;
                  Possible[allcards - 1] = Possible[allcards - 1] + 8;
                  where += 1;
                };
              };
            } while (!(where < 0));
          };
        };
        for (allcards = 0; allcards <= 8; allcards++) if (mylegal[allcards] !== 0) {
          Expect[allcards] = 0}
         else Expect[allcards] = -2147483647;
        fCardsInGame = rtl.unionSet(rtl.unionSet(rtl.unionSet($Self.fMyView[0],$Self.fMyView[3]),$Self.fMyView[1]),$Self.fMyView[2]);
        winner = pas.SWSBase.WinnerOfTrick($Self.fTrump,pas.SWSBase.TTrick.$clone(NewTrick));
        MaxIndex = 9 - $Self.fTricksTaken[1] - $Self.fTricksTaken[2];
        if (countstich) {
          ingame = MaxIndex;
          minvalue = ingame - 1;
          maxvalue = ingame;
          if ($Self.fTricksTaken[pas.SWSBase.gTeamOf[$Self.fPlayer]] === 0) {
            minvalue = -ingame;
            maxvalue = -ingame + 1;
          };
          allcards = NewTrick.fPlayed[winner];
          if (allcards !== 0) fCardsInGame = rtl.unionSet(fCardsInGame,rtl.createSet(allcards));
          for (allcards = 1; allcards <= 36; allcards++) NextCard[pas.SWSBase.gColourOf[allcards]][$mod.CurrentRank[allcards]] = allcards;
          AdjUp[0] = 0;
          AdjDown[0] = 0;
          for (colors = 1; colors <= 4; colors++) {
            lastcard = 0;
            for (sample = 0; sample <= 8; sample++) {
              allcards = NextCard[colors][sample];
              if (allcards in fCardsInGame) {
                AdjDown[allcards] = lastcard;
                AdjUp[allcards] = 0;
                if (lastcard !== 0) AdjUp[lastcard] = allcards;
                lastcard = allcards;
              };
            };
          };
        } else {
          points = pas.SWSBase.ValueOfTrick($Self.fTrump,pas.SWSBase.TTrick.$clone(NewTrick));
          ingame = 5 + points;
          for (allcards = 1; allcards <= 36; allcards++) if (allcards in fCardsInGame) ingame = ingame + $mod.CardValues[allcards];
          minvalue = -ingame;
          maxvalue = ingame;
          if ($Self.fTricksTaken[pas.SWSBase.gTeamOf[$Self.fPlayer]] === 0) minvalue = minvalue - 100;
          if ($Self.fTricksTaken[pas.SWSBase.gTeamOf[pas.SWSBase.gNextPlayer[$Self.fPlayer]]] === 0) maxvalue = maxvalue + 100;
        };
        pas.SWSBase.CardSetToHand(rtl.refSet($Self.fProbableView[$Self.fPlayer - 1]),{a: $Self.fPlayer, p: Allhands, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
        for (player = 1; player <= 4; player++) {
          NrCardsLeft[player] = MaxIndex;
          if (NewTrick.fPlayed[player] !== 0) NrCardsLeft[player] = NrCardsLeft[player] - 1;
        };
        sample = 0;
        if (depth < 26) {
          sample = 2147483647;
          totalcount = 0;
          Distribute({p: $Self, get: function () {
              return this.p.fProbableView;
            }, set: function (v) {
              this.p.fProbableView = v;
            }},0,0,0,0);
          if ($Self.fcount < 20) {
            sample = rtl.trunc(totalcount / 10)}
           else if ($Self.fcount < 24) {
            sample = rtl.trunc(totalcount / 20)}
           else sample = rtl.trunc(totalcount / 50);
        };
        totalcount = 0;
        Distribute({p: $Self, get: function () {
            return this.p.fProbableView;
          }, set: function (v) {
            this.p.fProbableView = v;
          }},points,pas.SWSBase.gColourOf[NewTrick.fPlayed[NewTrick.fLeading]],NewTrick.fPlayed[winner],winner);
        best = -2147483647;
        for (allcards = 0; allcards <= 8; allcards++) if (Expect[allcards] > best) best = Expect[allcards];
        sample = 0;
        for (allcards = 0; allcards <= 8; allcards++) if (Expect[allcards] !== best) {
          mylegal[allcards] = 0}
         else {
          found = mylegal[allcards];
          sample += 1;
        };
        Result = sample === 1;
        return Result;
      };
      pas.SWSCmds.InitCommand(answer,0);
      pas.SWSBase.CardSetToHand(rtl.refSet(this.fProbableView[this.fPlayer - 1]),{get: function () {
          return myhand;
        }, set: function (v) {
          myhand = v;
        }});
      var $tmp = aReq.fCmdID;
      if (($tmp === 2002) || ($tmp === 2003)) {
        $impl.BestTrump(pas.SWSBase.TRules.$clone(this.fRules),this.fPoints.slice(0),this.fPlayer,myhand.slice(0),aReq.fCmdID === 2002,{get: function () {
            return best;
          }, set: function (v) {
            best = v;
          }},{get: function () {
            return tempBestWyss;
          }, set: function (v) {
            tempBestWyss = v;
          }});
        if (best === 0) {
          pas.SWSCmds.InitCommand(answer,2003);
          answer.fCData.fPlayer = this.fPlayer;
        } else {
          pas.SWSCmds.InitCommand(answer,2002);
          answer.fCData.fPlayer = this.fPlayer;
          answer.fCData.fTrump = best;
        };
      } else if ($tmp === 2006) {
        suitC = aReq.fCData;
        if ((suitC !== null) && (suitC.fSuit.fCount > 0)) {
          pas.SWSCmds.InitCommand(answer,2006);
          answer.fCData.fPlayer = this.fPlayer;
          answer.fCData.fSuit.$assign(suitC.fSuit);
        };
      } else if ($tmp === 2004) {
        playC = aReq.fCData;
        mylegal = playC.fLegal;
        found = 0;
        if ($mod.CountHand({get: function () {
            return mylegal;
          }, set: function (v) {
            mylegal = v;
          }}) > 1) {
          $impl.Provable(this.fTrump,this.fPlayer,pas.SWSBase.TTrick.$clone(playC.fTrick),{p: this, get: function () {
              return this.p.fProbableView;
            }, set: function (v) {
              this.p.fProbableView = v;
            }},{get: function () {
              return mylegal;
            }, set: function (v) {
              mylegal = v;
            }});
          if ($mod.CountHand({get: function () {
              return mylegal;
            }, set: function (v) {
              mylegal = v;
            }}) > 1) {
            if ((this.fcount < $mod.PerfectPlay[this.fPlayer]) || !BestPlay(false,this.fcount,pas.SWSBase.TTrick.$clone(playC.fTrick))) if (($mod.PlayLevel[this.fPlayer] > 66) || ((this.fcount % 4) !== 0) || (($mod.PlayLevel[this.fPlayer] > 33) && ((rtl.trunc(this.fcount / 4) % 3) !== 2))) didfind = false;
            if ((this.fcount < $mod.PerfectPlay[this.fPlayer]) && (this.fcount >= ($mod.PerfectPlay[this.fPlayer] - 4)) && ((this.fTricksTaken[1] === 0) || (this.fTricksTaken[2] === 0))) didfind = BestPlay(true,this.fcount,pas.SWSBase.TTrick.$clone(playC.fTrick));
            if (!didfind) found = $impl.PlayCard(this.fTrump,this.fPlayer,this.fTrumpPlayer,pas.SWSBase.TTrick.$clone(playC.fTrick),this.fWantColor.slice(0),{p: this, get: function () {
                return this.p.fMyView;
              }, set: function (v) {
                this.p.fMyView = v;
              }},{p: this, get: function () {
                return this.p.fProbableView;
              }, set: function (v) {
                this.p.fProbableView = v;
              }},{p: this, get: function () {
                return this.p.fHasAtLeast;
              }, set: function (v) {
                this.p.fHasAtLeast = v;
              }},{get: function () {
                return mylegal;
              }, set: function (v) {
                mylegal = v;
              }},{p: playC, get: function () {
                return this.p.fLegal;
              }, set: function (v) {
                this.p.fLegal = v;
              }},this.fcount);
            if (found === 0) found = $impl.Throw(false,this.fTrump,this.fPlayer,this.fTrumpPlayer,pas.SWSBase.TTrick.$clone(playC.fTrick),{p: this, get: function () {
                return this.p.fProbableView;
              }, set: function (v) {
                this.p.fProbableView = v;
              }},this.fWantColor.slice(0),mylegal.slice(0),playC.fLegal);
          };
        };
        if (found === 0) {
          for (i = 0; i <= 8; i++) if (mylegal[i] !== 0) found = mylegal[i];
        };
        pas.SWSCmds.InitCommand(answer,2005);
        answer.fCData.fPlayer = this.fPlayer;
        answer.fCData.fCard = found;
      } else {
        pas.SWSPlay.TJassHandler.HandleRequest.call(this,pas.SWSCmds.TCommand.$clone(aReq),answer);
      };
    };
    this.NotifyCommand = function (aCmd) {
      var player = 0;
      var thiscard = 0;
      var allcards = 0;
      var depth = 0;
      var min = 0;
      var max = 0;
      var WholeSuit = null;
      var ThisSuit = pas.SWSBase.TSuits.$new();
      var ok = false;
      var count = 0;
      var $tmp = aCmd.fCmdID;
      if ($tmp === 1100) {
        this.fPlayer = aCmd.fCData.fPlayer;
        this.fShifted = false;
        depth = 22;
        for (player = 1; player <= 4; player++) {
          if (aCmd.fCData.fTypes[player] === 0) depth = 18;
          $mod.IsGrumpy[player] = aCmd.fCData.fTypes[player] === aCmd.fCData.fTypes[this.fPlayer];
        };
        for (player = 1; player <= 4; player++) $mod.PerfectPlay[player] = depth;
        for (player = 1; player <= 4; player++) {
          $mod.PlayLevel[player] = aCmd.fCData.fLevel[player];
          if ($mod.PlayLevel[player] !== 99) $mod.PerfectPlay[player] = 36;
        };
      } else if ($tmp === 2003) {
        this.fShifted = true;
      } else if ($tmp === 2000) {
        for (player = 1; player <= 4; player++) {
          this.fSuitMask[player - 1] = rtl.createSet(null,1,36);
        };
        this.fTricksTaken[1] = 0;
        this.fTricksTaken[2] = 0;
        this.fPoints = aCmd.fCData.fPoints;
        $mod.InitGlobals(this.fPlayer,{p: this, get: function () {
            return this.p.fcount;
          }, set: function (v) {
            this.p.fcount = v;
          }},{p: this, get: function () {
            return this.p.fHasAtLeast;
          }, set: function (v) {
            this.p.fHasAtLeast = v;
          }},{p: this, get: function () {
            return this.p.fWantColor;
          }, set: function (v) {
            this.p.fWantColor = v;
          }},{p: this, get: function () {
            return this.p.fMyView;
          }, set: function (v) {
            this.p.fMyView = v;
          }},{p: this, get: function () {
            return this.p.fProbableView;
          }, set: function (v) {
            this.p.fProbableView = v;
          }},{p: this, get: function () {
            return this.p.fColorLead;
          }, set: function (v) {
            this.p.fColorLead = v;
          }},{a: this.fPlayer, p: aCmd.fCData.fHands, get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }});
      } else if ($tmp === 2001) {
        this.fMyView[this.fPlayer - 1] = rtl.refSet(pas.SWSBase.HandToCardSet(aCmd.fCData.fHands[this.fPlayer].slice(0)));
      } else if ($tmp === 2002) {
        this.fTrump = aCmd.fCData.fTrump;
        this.fTrumpPlayer = aCmd.fCData.fPlayer;
        $mod.InitGlobals2(this.fPlayer,this.fTrumpPlayer,this.fTrump,this.fShifted,{p: this, get: function () {
            return this.p.fHasAtLeast;
          }, set: function (v) {
            this.p.fHasAtLeast = v;
          }});
        for (thiscard = 0; thiscard <= 36; thiscard++) {
          $mod.CardValues[thiscard] = pas.SWSBase.gValueOfCard[this.fTrump][thiscard];
          if (this.fTrump === pas.SWSBase.gColourOf[thiscard]) {
            $mod.CurrentRank[thiscard] = pas.SWSBase.TrumpRank(pas.SWSBase.gRankOf[thiscard]) - 1}
           else if (this.fTrump === 6) {
            $mod.CurrentRank[thiscard] = 9 - pas.SWSBase.gRankOf[thiscard]}
           else $mod.CurrentRank[thiscard] = pas.SWSBase.gRankOf[thiscard] - 1;
          for (allcards = 0; allcards <= 36; allcards++) $mod.CardBetter[thiscard][allcards] = pas.SWSBase.gBetterCard[this.fTrump][thiscard][allcards];
        };
      } else if ($tmp === 2007) {
        this.fShifted = false;
      } else if ($tmp === 2005) {
        thiscard = aCmd.fCData.fCard;
        player = aCmd.fCData.fPlayer;
        ok = $mod.UpdateMayHave(this.fTrumpPlayer,thiscard,player,this.fPlayer,this.fTrump,{p: this, get: function () {
            return this.p.fProbableView;
          }, set: function (v) {
            this.p.fProbableView = v;
          }},{p: this, get: function () {
            return this.p.fMyView;
          }, set: function (v) {
            this.p.fMyView = v;
          }},{p: this, get: function () {
            return this.p.fSuitMask;
          }, set: function (v) {
            this.p.fSuitMask = v;
          }},{p: this, get: function () {
            return this.p.fHasAtLeast;
          }, set: function (v) {
            this.p.fHasAtLeast = v;
          }},{p: this, get: function () {
            return this.p.fColorLead;
          }, set: function (v) {
            this.p.fColorLead = v;
          }},{p: this, get: function () {
            return this.p.fcount;
          }, set: function (v) {
            this.p.fcount = v;
          }},this.fTrick,{p: this, get: function () {
            return this.p.fWantColor;
          }, set: function (v) {
            this.p.fWantColor = v;
          }});
        if ((this.fcount % 4) === 0) {
          this.fTricksTaken[pas.SWSBase.gTeamOf[this.fTrick.fLeading]] += 1;
          this.fPoints[pas.SWSBase.gTeamOf[this.fTrick.fLeading]] = this.fPoints[pas.SWSBase.gTeamOf[this.fTrick.fLeading]] + pas.SWSBase.ValueOfTrick(this.fTrump,pas.SWSBase.TTrick.$clone(this.fTrick));
        };
      } else if ($tmp === 2006) {
        WholeSuit = aCmd.fCData;
        ThisSuit.$assign(WholeSuit.fSuit);
        for (var $l = 0, $end = ThisSuit.fCount - 1; $l <= $end; $l++) {
          count = $l;
          min = 36;
          max = 0;
          for (allcards = 1; allcards <= 36; allcards++) if (allcards in ThisSuit.fCalls[count].fCards) {
            if (min > allcards) {
              min = allcards}
             else if (max < allcards) max = allcards;
          };
          for (player = 1; player <= 4; player++) if (player !== WholeSuit.fPlayer) {
            this.fMyView[player - 1] = rtl.diffSet(this.fMyView[player - 1],ThisSuit.fCalls[count].fCards);
            this.fProbableView[player - 1] = rtl.diffSet(this.fProbableView[player - 1],ThisSuit.fCalls[count].fCards);
            this.fSuitMask[player - 1] = rtl.diffSet(this.fSuitMask[player - 1],ThisSuit.fCalls[count].fCards);
          } else if ((pas.SWSBase.gColourOf[max] === pas.SWSBase.gColourOf[min]) && ((max - min) > 1)) {
            if ((min !== 1) && (pas.SWSBase.gColourOf[min - 1] === pas.SWSBase.gColourOf[min])) {
              this.fProbableView[player - 1] = rtl.diffSet(this.fProbableView[player - 1],rtl.createSet(min - 1));
            };
            if ((max !== 36) && (pas.SWSBase.gColourOf[max] === pas.SWSBase.gColourOf[max + 1])) {
              this.fProbableView[player - 1] = rtl.diffSet(this.fProbableView[player - 1],rtl.createSet(max + 1));
            };
          };
        };
      };
      pas.Jassers.TProtoJasser.NotifyCommand.call(this,pas.SWSCmds.TCommand.$clone(aCmd));
    };
  });
  rtl.recNewT(this,"HashEntry",function () {
    this.hashcode = 0;
    this.lowvalue = 0;
    this.highvalue = 0;
    this.$eq = function (b) {
      return (this.hashcode === b.hashcode) && (this.lowvalue === b.lowvalue) && (this.highvalue === b.highvalue);
    };
    this.$assign = function (s) {
      this.hashcode = s.hashcode;
      this.lowvalue = s.lowvalue;
      this.highvalue = s.highvalue;
      return this;
    };
    var $r = $mod.$rtti.$Record("HashEntry",{},this);
    $r.addField("hashcode",rtl.longint);
    $r.addField("lowvalue",rtl.longint);
    $r.addField("highvalue",rtl.longint);
  });
  this.AllBoeckHand = function (trump, CardsToCheck, CardsInGame) {
    var Result = rtl.arraySetLength(null,0,9);
    var i = 0;
    var allcards = 0;
    var resultHand = rtl.arraySetLength(null,0,9);
    var boeck = rtl.arraySetLength(null,0,5);
    var color = 0;
    resultHand = CardsToCheck.get().slice(0);
    for (color = 1; color <= 4; color++) boeck[color] = $mod.BockCard({get: function () {
        return CardsInGame;
      }, set: function (v) {
        CardsInGame = v;
      }},color);
    for (i = 0; i <= 8; i++) {
      allcards = CardsToCheck.get()[i];
      if (allcards !== 0) {
        color = pas.SWSBase.gColourOf[allcards];
        if ((color === trump) || $mod.CardBetter[allcards][boeck[color]]) resultHand[i] = 0;
      };
    };
    Result = resultHand.slice(0);
    return Result;
  };
  this.CouldBeBetter = function (trump, card, PossibleCards) {
    var Result = false;
    var res = false;
    res = $mod.CardBetter[card][$mod.BockCard(PossibleCards,pas.SWSBase.gColourOf[card])];
    if ((trump !== 0) && !res) res = (pas.SWSBase.gColourOf[card] !== trump) && ($mod.CountColorCards(PossibleCards,trump) > 0);
    Result = res;
    return Result;
  };
  this.Adjacent = function (card1, card2, between) {
    var Result = false;
    var allcards = 0;
    var cardcolor = 0;
    var low = 0;
    var high = 0;
    var i = 0;
    Result = false;
    cardcolor = pas.SWSBase.gColourOf[card1];
    if (cardcolor === pas.SWSBase.gColourOf[card2]) {
      Result = true;
      if ($mod.CardBetter[card1][card2]) {
        low = card1;
        high = card2;
      } else {
        low = card2;
        high = card1;
      };
      for (i = 1; i <= 9; i++) {
        allcards = pas.SWSBase.gCardOf[cardcolor][i];
        if ((allcards in between.get()) && $mod.CardBetter[low][allcards] && $mod.CardBetter[allcards][high]) Result = false;
      };
    };
    return Result;
  };
  this.BockCard = function (CardsInGame, color) {
    var Result = 0;
    var best = 0;
    var allcards = 0;
    var i = 0;
    best = 0;
    for (i = 1; i <= 9; i++) {
      allcards = pas.SWSBase.gCardOf[color][i];
      if ($mod.CardBetter[best][allcards] && (allcards in CardsInGame.get())) best = allcards;
    };
    Result = best;
    return Result;
  };
  this.GetsStich = function (disallow, fTrump, legal, player, mainplayer, trick, stich, ProbableView) {
    var Result = rtl.arraySetLength(null,0,9);
    var allcards = 0;
    var who = 0;
    var mystich = 0;
    var card = 0;
    var SureCard = {};
    var OppCards = {};
    var resultHand = rtl.arraySetLength(null,0,9);
    OppCards = {};
    for (who = 1; who <= 4; who++) if ((trick.fPlayed[who] === 0) && (pas.SWSBase.gTeamOf[mainplayer] !== pas.SWSBase.gTeamOf[who])) OppCards = rtl.unionSet(OppCards,ProbableView.get()[who - 1]);
    if ((player !== mainplayer) && (trick.fPlayed[player] === 0)) {
      SureCard = rtl.refSet(ProbableView.get()[player - 1]);
      for (who = 1; who <= 4; who++) if (who !== player) SureCard = rtl.diffSet(SureCard,ProbableView.get()[who - 1]);
    };
    for (allcards = 0; allcards <= 8; allcards++) {
      resultHand[allcards] = 0;
      if ((legal[allcards] !== 0) && (pas.SWSBase.gColourOf[legal[allcards]] !== disallow)) {
        mystich = stich;
        if ($mod.CardBetter[mystich][legal[allcards]]) mystich = legal[allcards];
        if ((trick.fPlayed[player] === mystich) || ((player === mainplayer) && (mystich === legal[allcards]))) {
          if (!$mod.CouldBeBetter(fTrump,mystich,{get: function () {
              return OppCards;
            }, set: function (v) {
              OppCards = v;
            }})) {
            if (!((player === mainplayer) && (trick.fPlayed[pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[mainplayer]]] === 0) && $mod.CouldBeBetter(0,mystich,{a: pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[mainplayer]] - 1, p: ProbableView.get(), get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }}))) resultHand[allcards] = legal[allcards];
          };
        } else if ((player !== mainplayer) && (trick.fPlayed[player] === 0)) {
          for (card = 1; card <= 36; card++) {
            if ((card in SureCard) && (pas.SWSBase.gColourOf[card] !== disallow)) {
              if ($mod.CardBetter[mystich][card]) {
                if (!$mod.CouldBeBetter(fTrump,card,{get: function () {
                    return OppCards;
                  }, set: function (v) {
                    OppCards = v;
                  }})) {
                  resultHand[allcards] = legal[allcards];
                  break;
                };
              };
            };
          };
        };
      };
    };
    Result = resultHand.slice(0);
    return Result;
  };
  this.BockErwartung = function (hand, restcards, Color, optimistic, lead, card) {
    var Result = 0.0;
    var allcards = 0;
    var i = 0;
    var j = 0;
    var temp = 0;
    var variants = 0;
    var which = 0;
    var This = 0;
    var special = rtl.arraySetLength(null,0,9);
    var realh = rtl.arraySetLength(null,0,9);
    var play = rtl.arraySetLength(null,0,5);
    var bestcard = 0;
    var has = false;
    var hascard = false;
    var realcard = rtl.arraySetLength(null,0,9);
    var occur = rtl.arraySetLength(null,0,9);
    which = 0;
    variants = 1;
    for (i = 0; i <= 8; i++) special[i] = 0;
    for (i = 0; i <= 8; i++) realcard[i] = 0;
    hascard = false;
    for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[hand.get()[i]] === Color) {
      This = $mod.CurrentRank[hand.get()[i]];
      special[This] = 1;
      realcard[This] = i;
      hascard = true;
    };
    for (i = 1; i <= 9; i++) {
      allcards = pas.SWSBase.gCardOf[Color][i];
      if (allcards in restcards.get()) {
        variants = variants * 3;
        special[$mod.CurrentRank[allcards]] = 3;
      };
    };
    j = 0;
    for (i = 0; i <= 8; i++) {
      if (special[i] !== 0) {
        special[j] = special[i];
        realcard[j] = realcard[i];
        if (special[i] === 1) which = which + $mod.Powers[j];
        j += 1;
      };
    };
    for (var $l = j + 1; $l <= 8; $l++) {
      i = $l;
      realcard[i] = 0;
    };
    var $tmp = j;
    if ($tmp === 0) {
      which = which + 1022}
     else if ($tmp === 1) {
      which = which + 1020}
     else if ($tmp === 2) {
      which = which + 1016}
     else if ($tmp === 3) {
      which = which + 1008}
     else if ($tmp === 4) {
      which = which + 992}
     else if ($tmp === 5) {
      which = which + 960}
     else if ($tmp === 6) {
      which = which + 896}
     else if ($tmp === 7) {
      which = which + 768}
     else if ($tmp === 8) {
      which = which + 512}
     else if ($tmp === 9) which = which + 0;
    if (optimistic) which = which + 1024;
    if (!lead) which = which + 2048;
    if ($impl.FileInfo2[which].value === -100) {
      for (var $l1 = j; $l1 <= 8; $l1++) {
        i = $l1;
        special[i] = 0;
      };
      for (i = 0; i <= 8; i++) occur[i] = 0;
      for (i = 1; i <= 4; i++) play[i] = -1;
      for (var $l2 = 0, $end = variants - 1; $l2 <= $end; $l2++) {
        i = $l2;
        realh = special.slice(0);
        temp = i;
        for (j = 0; j <= 8; j++) if (realh[j] === 3) {
          realh[j] = 2 + (temp % 3);
          temp = rtl.trunc(temp / 3);
        };
        if (lead) {
          for (j = 0; j <= 8; j++) if (realh[j] === 1) {
            realh[j] = 0;
            play[1] = j + 1;
            occur[j] = occur[j] + 1 + $impl.NrBoeck(lead,optimistic,pas.SWSBase.gNextPlayer[1],play.slice(0),realh.slice(0));
            realh[j] = 1;
          };
        } else {
          has = false;
          for (j = 0; j <= 8; j++) if (realh[j] === 3) has = true;
          if (!has) {
            play[3] = 0;
            occur[0] = occur[0] + 1 + $impl.NrBoeck(lead,optimistic,pas.SWSBase.gNextPlayer[3],play.slice(0),realh.slice(0));
          } else occur[0] = occur[0] + 1 + $impl.NrBoeck(lead,optimistic,3,play.slice(0),realh.slice(0));
        };
      };
      bestcard = 0;
      for (i = 1; i <= 8; i++) if (occur[i] > occur[bestcard]) bestcard = i;
      if (occur[bestcard] === 0) {
        $impl.FileInfo2[which].value = 0;
        $impl.FileInfo2[which].card = 0;
      } else {
        $impl.FileInfo2[which].value = (occur[bestcard] - variants) / variants;
        $impl.FileInfo2[which].card = bestcard;
      };
    };
    bestcard = $impl.FileInfo2[which].card;
    card.set(hand.get()[realcard[bestcard]]);
    Result = $impl.FileInfo2[which].value;
    if (!hascard && (variants === 1)) Result = 0;
    return Result;
  };
  this.CountCards = function (CardSet) {
    var Result = 0;
    var count = 0;
    var i = 0;
    count = 0;
    for (i = 1; i <= 36; i++) if (i in CardSet.get()) count += 1;
    Result = count;
    return Result;
  };
  this.CountColorCards = function (CardSet, color) {
    var Result = 0;
    var count = 0;
    var i = 0;
    count = 0;
    if (color < 5) for (i = 1; i <= 9; i++) if (pas.SWSBase.gCardOf[color][i] in CardSet.get()) count += 1;
    Result = count;
    return Result;
  };
  this.CountHand = function (hand) {
    var Result = 0;
    var count = 0;
    var i = 0;
    count = 0;
    for (i = 0; i <= 8; i++) if (hand.get()[i] !== 0) count += 1;
    Result = count;
    return Result;
  };
  this.CountColorHand = function (hand, color) {
    var Result = 0;
    var count = 0;
    var i = 0;
    count = 0;
    if (color < 5) for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[hand.get()[i]] === color) count += 1;
    Result = count;
    return Result;
  };
  this.InitGlobals = function (fPlayer, fCount, fHasAtLeast, fWantColor, fMyView, fProbableView, fColorLead, originalHand) {
    var player = 0;
    var color = 0;
    fCount.set(0);
    for (player = 1; player <= 4; player++) {
      for (color = 1; color <= 4; color++) {
        fHasAtLeast.get()[player][color] = 0;
        fColorLead.get()[color] = false;
      };
      fWantColor.get()[player] = 0;
      fMyView.get()[player - 1] = rtl.diffSet(rtl.createSet(null,1,36),pas.SWSBase.HandToCardSet(originalHand.get().slice(0)));
      fProbableView.get()[player - 1] = rtl.refSet(fMyView.get()[player - 1]);
    };
    fMyView.get()[fPlayer - 1] = rtl.refSet(pas.SWSBase.HandToCardSet(originalHand.get().slice(0)));
    fProbableView.get()[fPlayer - 1] = rtl.refSet(fMyView.get()[fPlayer - 1]);
  };
  this.InitGlobals2 = function (fPlayer, fTrumpPlayer, fTrump, fShifted, fHasAtLeast) {
    if ((fTrump < 5) && (fPlayer !== fTrumpPlayer)) {
      if (fShifted) {
        fHasAtLeast.get()[fTrumpPlayer][fTrump] = 3}
       else fHasAtLeast.get()[fTrumpPlayer][fTrump] = 4;
    };
  };
  this.UpdateMayHave = function (fTrumpPlayer, thiscard, player, fPlayer, fTrump, fProbableView, fMyView, fSuitMask, fHasAtLeast, fColorLead, fCount, fTrick, fWantColor) {
    var Result = false;
    var ok = false;
    var pass = false;
    var who = 0;
    var who2 = 0;
    var stichPlayer = 0;
    var i = 0;
    var j = 0;
    var count = 0;
    var allcards = 0;
    var fCardsInGame = {};
    var thiscolor = 0;
    var leadcolor = 0;
    var color = 0;
    function ReduceCards(mainplayer, cardCount, thisTrick, Cards, Fix) {
      var Result = false;
      var redo = rtl.arraySetLength(null,false,5);
      var player = 0;
      var who = 0;
      var temp = {};
      var temp2 = {};
      var color = 0;
      var total = 0;
      var diff = 0;
      var i = 0;
      var infinite = 0;
      var Played = rtl.arraySetLength(null,0,5);
      temp = rtl.refSet(fCardsInGame);
      for (player = 1; player <= 4; player++) temp = rtl.diffSet(temp,Cards.get()[player - 1]);
      if (rtl.neSet(temp,{})) {
        for (player = 1; player <= 4; player++) {
          temp2 = rtl.intersectSet(rtl.diffSet(Fix.get()[player - 1],Cards.get()[player - 1]),temp);
          if (rtl.neSet(temp2,{})) Cards.get()[player - 1] = rtl.unionSet(Cards.get()[player - 1],temp2);
        };
      };
      for (player = 1; player <= 4; player++) {
        Played[player] = rtl.trunc(cardCount / 4);
        if (((cardCount % 4) !== 0) && (thisTrick.fPlayed[player] !== 0)) Played[player] = Played[player] + 1;
      };
      redo[0] = false;
      for (player = 1; player <= 4; player++) redo[player] = true;
      infinite = 0;
      do {
        player = 0;
        redo[mainplayer] = false;
        for (who = 1; who <= 4; who++) if (redo[who]) player = who;
        if (redo[player]) {
          redo[player] = false;
          temp = rtl.refSet(Cards.get()[player - 1]);
          for (who = 1; who <= 4; who++) if (who !== player) temp = rtl.diffSet(temp,Cards.get()[who - 1]);
          if ((Played[player] + $mod.CountCards({get: function () {
              return temp;
            }, set: function (v) {
              temp = v;
            }})) === 9) {
            Cards.get()[player - 1] = rtl.refSet(temp);
            total = 9;
          } else total = Played[player] + $mod.CountCards({a: player - 1, p: Cards.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }});
          if (total === 9) {
            for (who = 1; who <= 4; who++) if (who !== player) {
              temp = rtl.diffSet(Cards.get()[who - 1],Cards.get()[player - 1]);
              if (rtl.neSet(temp,Cards.get()[who - 1])) {
                Cards.get()[who - 1] = rtl.refSet(temp);
                redo[who] = true;
              };
            };
          } else if (total > 9) {
            for (color = 1; color <= 4; color++) {
              diff = $mod.CountColorCards({a: player - 1, p: Cards.get(), get: function () {
                  return this.p[this.a];
                }, set: function (v) {
                  this.p[this.a] = v;
                }},color) - fHasAtLeast.get()[player][color];
              if (diff < 0) {
                fHasAtLeast.get()[player][color] = fHasAtLeast.get()[player][color] + diff;
                diff = 0;
              };
              if ((fHasAtLeast.get()[player][color] > 0) && (diff <= 0)) {
                temp = {};
                for (i = 1; i <= 9; i++) if (pas.SWSBase.gCardOf[color][i] in Cards.get()[player - 1]) temp = rtl.unionSet(temp,rtl.createSet(pas.SWSBase.gCardOf[color][i]));
                for (who = 1; who <= 4; who++) if (who !== player) {
                  temp2 = rtl.diffSet(Cards.get()[who - 1],temp);
                  if (rtl.neSet(temp2,Cards.get()[who - 1])) {
                    Cards.get()[who - 1] = rtl.refSet(temp2);
                    redo[who] = true;
                  };
                };
              };
            };
          } else {
            for (who = 1; who <= 4; who++) {
              redo[who] = true;
              for (color = 1; color <= 4; color++) fHasAtLeast.get()[who][color] = 0;
            };
            Cards.set($mod.TAllCards$clone(Fix.get()));
            infinite += 1;
          };
        };
      } while (!((player === 0) || (infinite > 1)));
      Result = infinite < 2;
      return Result;
    };
    pass = true;
    fCardsInGame = rtl.unionSet(rtl.unionSet(rtl.unionSet(fMyView.get()[0],fMyView.get()[3]),fMyView.get()[1]),fMyView.get()[2]);
    thiscolor = pas.SWSBase.gColourOf[thiscard];
    fHasAtLeast.get()[player][thiscolor] = fHasAtLeast.get()[player][thiscolor] - 1;
    if ((fCount.get() % 4) === 0) {
      fTrick.fLeading = player;
      for (who2 = 1; who2 <= 4; who2++) fTrick.fPlayed[who2] = 0;
    };
    fTrick.fPlayed[player] = thiscard;
    leadcolor = pas.SWSBase.gColourOf[fTrick.fPlayed[fTrick.fLeading]];
    stichPlayer = pas.SWSBase.WinnerOfTrick(fTrump,pas.SWSBase.TTrick.$clone(fTrick));
    if (fCount.get() < 32) {
      if ((fCount.get() % 4) === 0) {
        if (player !== fPlayer) {
          if ((fTrump < 5) && (thiscolor !== fTrump) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[player] - 1, p: fProbableView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fTrump) === 0) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[player]]] - 1, p: fProbableView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fTrump) === 0)) {
            if ($mod.CardBetter[thiscard][$mod.BockCard({get: function () {
                return fCardsInGame;
              }, set: function (v) {
                fCardsInGame = v;
              }},thiscolor)]) for (color = 1; color <= 4; color++) if (color !== fTrump) fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],rtl.createSet($mod.BockCard({get: function () {
                return fCardsInGame;
              }, set: function (v) {
                fCardsInGame = v;
              }},color)));
          };
          if ((fTrump < 5) && (thiscolor === fTrump)) {
            allcards = $mod.BockCard({get: function () {
                return fCardsInGame;
              }, set: function (v) {
                fCardsInGame = v;
              }},fTrump);
            if (thiscard !== allcards) fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],rtl.createSet(allcards));
          };
          if ((fCount.get() === 0) && (fTrump < 5)) fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],$impl.GetHigher(thiscard,fTrump));
          if (!fColorLead.get()[thiscolor] && (thiscolor !== fTrump) && ($mod.BockCard({get: function () {
              return fCardsInGame;
            }, set: function (v) {
              fCardsInGame = v;
            }},thiscolor) !== thiscard)) {
            i = 1;
            if (fCount.get() === 0) i = 2;
            if ($mod.CountColorCards({a: player - 1, p: fProbableView.get(), get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},thiscolor) <= (i + 1)) i = 0;
            for (j = 1; j <= 9; j++) {
              count = 0;
              for (who = 1; who <= 4; who++) if ((who !== fPlayer) && (pas.SWSBase.gCardOf[thiscolor][j] in fProbableView.get()[who - 1])) count += 1;
              if ((count !== 0) && (count !== 3)) i = 0;
            };
            for (who = 1; who <= 4; who++) if ((who !== fPlayer) && ($mod.CountColorCards({a: who - 1, p: fSuitMask.get(), get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},thiscolor) !== 9)) i = 0;
            if (fHasAtLeast.get()[player][thiscolor] < i) fHasAtLeast.get()[player][thiscolor] = i;
          };
        };
        fColorLead.get()[thiscolor] = true;
      };
      fCount.set(fCount.get() + 1);
      fCardsInGame = rtl.diffSet(fCardsInGame,rtl.createSet(thiscard));
      for (who = 1; who <= 4; who++) {
        fMyView.get()[who - 1] = rtl.diffSet(fMyView.get()[who - 1],rtl.createSet(thiscard));
        fProbableView.get()[who - 1] = rtl.diffSet(fProbableView.get()[who - 1],rtl.createSet(thiscard));
      };
      if ((thiscolor !== fTrump) && (thiscolor !== leadcolor)) {
        if (fPlayer !== player) for (i = 1; i <= 9; i++) {
          allcards = pas.SWSBase.gCardOf[leadcolor][i];
          if ((pas.SWSBase.gColourOf[allcards] !== fTrump) || (allcards !== pas.SWSBase.gCardOf[fTrump][6])) {
            fMyView.get()[player - 1] = rtl.diffSet(fMyView.get()[player - 1],rtl.createSet(allcards));
            fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],rtl.createSet(allcards));
          };
        };
        if ((fWantColor.get()[player] === 0) && (player === pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fPlayer]])) {
          fWantColor.get()[player] = thiscolor;
          do {
            if (fWantColor.get()[player] === 4) fWantColor.get()[player] = 0;
            fWantColor.get()[player] = fWantColor.get()[player] + 1;
          } while (!((fWantColor.get()[player] === thiscolor) || ((fWantColor.get()[player] !== fTrump) && ($mod.CountColorCards({a: player - 1, p: fMyView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fWantColor.get()[player]) > 0))));
          if ((fWantColor.get()[player] === thiscolor) || !($mod.BockCard({get: function () {
              return fCardsInGame;
            }, set: function (v) {
              fCardsInGame = v;
            }},fWantColor.get()[player]) in fMyView.get()[player - 1])) fWantColor.get()[player] = leadcolor;
        };
      };
      if (fPlayer !== player) {
        if (stichPlayer !== player) {
          ok = true;
          who2 = pas.SWSBase.gNextPlayer[player];
          while (who2 !== fTrick.fLeading) {
            ok = ok && ((pas.SWSBase.gTeamOf[stichPlayer] === pas.SWSBase.gTeamOf[who2]) || !$mod.CouldBeBetter(fTrump,fTrick.fPlayed[stichPlayer],{a: who2 - 1, p: fProbableView.get(), get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }}));
            who2 = pas.SWSBase.gNextPlayer[who2];
          };
          if (ok) fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],$impl.GetLower(fTrick.fPlayed[stichPlayer],thiscard,pas.SWSBase.gTeamOf[stichPlayer] === pas.SWSBase.gTeamOf[player],{get: function () {
              return fCardsInGame;
            }, set: function (v) {
              fCardsInGame = v;
            }}));
          if (((fCount.get() % 4) === 0) && (pas.SWSBase.gTeamOf[stichPlayer] !== pas.SWSBase.gTeamOf[player])) fProbableView.get()[player - 1] = rtl.diffSet(fProbableView.get()[player - 1],$impl.GetHigher(fTrick.fPlayed[stichPlayer],pas.SWSBase.gColourOf[fTrick.fPlayed[stichPlayer]]));
        };
      };
      if (((fCount.get() % 4) === 0) && (fWantColor.get()[fTrick.fLeading] === 0) && (leadcolor !== fTrump) && (stichPlayer !== fTrick.fLeading)) {
        ok = stichPlayer === pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fTrick.fLeading]];
        if (((fCount.get() <= 12) && (pas.SWSBase.gTeamOf[fTrumpPlayer] !== pas.SWSBase.gTeamOf[fPlayer])) || (fCount.get() <= 8) || (!ok && (pas.SWSBase.gColourOf[fTrick.fPlayed[stichPlayer]] !== fTrump)) || (ok && (leadcolor === fTrump))) fWantColor.get()[fTrick.fLeading] = leadcolor;
      };
      if ((((fCount.get() % 4) !== 0) && (pas.SWSBase.gNextPlayer[player] === fPlayer)) || (((fCount.get() % 4) === 0) && (stichPlayer === fPlayer))) {
        pass = ReduceCards(fPlayer,fCount.get(),fTrick,fProbableView,fMyView);
      };
    };
    if ((fCount.get() % 4) === 0) {
      fTrick.fLeading = stichPlayer;
      for (who2 = 1; who2 <= 4; who2++) fTrick.fPlayed[who2] = 0;
    };
    Result = pass;
    return Result;
  };
  this.GetAdr = function (trump, color, hand) {
    var Result = 0;
    var i = 0;
    var realrank = 0;
    var count = 0;
    var top = 0;
    var category = 0;
    count = 0;
    top = 0;
    category = 0;
    for (i = 0; i <= 8; i++) if ((trump === 6) && (pas.SWSBase.gRankOf[hand[i]] === 1)) {
      category += 1}
     else if ((trump === 5) && (pas.SWSBase.gRankOf[hand[i]] === 9)) {
      category += 1}
     else if (pas.SWSBase.gColourOf[hand[i]] === trump) category += 1;
    if (trump < 5) {
      if (category < 2) {
        category = 0}
       else if (category > 4) {
        category = 4}
       else category -= 1;
    };
    for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[hand[i]] === color) {
      realrank = pas.SWSBase.gRankOf[hand[i]];
      if (trump === color) {
        realrank = pas.SWSBase.TrumpRank(realrank) - 1}
       else if (trump === 6) {
        realrank = 9 - realrank}
       else realrank -= 1;
      if (realrank < 6) {
        count += 1}
       else if (realrank === 8) {
        top = top + 4}
       else if (realrank === 7) {
        top = top + 2}
       else if (realrank === 6) top += 1;
    };
    if (count > 4) count = 4;
    i = (5 * top) + count;
    if (trump === 6) {
      i = i + 240 + (40 * category)}
     else if (trump === 5) {
      i = i + 440 + (40 * category)}
     else if (trump !== color) i = i + 40 + (40 * category);
    Result = i;
    return Result;
  };
  this.GetShiftAdr = function (fRules, color, hand) {
    var Result = 0;
    var i = 0;
    var total = 0;
    total = 0;
    for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[hand[i]] === color) {
      total = total + $mod.Powers[pas.SWSBase.gRankOf[hand[i]] - 1];
    };
    if (fRules.fTrumpFactor[color] > 1) total = total + 512;
    Result = total;
    return Result;
  };
  this.GetWyssAdr = function (trump, Wyss) {
    var Result = 0;
    var i = 0;
    var lowest = 0;
    var rank = 0;
    var count = 0;
    var same = false;
    count = 0;
    lowest = 10;
    same = false;
    for (i = 1; i <= 36; i++) if (i in Wyss.get()) {
      count += 1;
      rank = pas.SWSBase.gRankOf[i];
      if (trump === 6) rank = 10 - rank;
      if (rank === lowest) same = true;
      if (rank < lowest) lowest = rank;
    };
    var $tmp = count;
    if (($tmp === 0) || ($tmp === 1) || ($tmp === 2)) {
      Result = 0}
     else if ($tmp === 3) {
      Result = lowest}
     else if ($tmp === 4) {
      if (!same) {
        Result = 7 + lowest}
       else {
        if (((lowest === 4) || (lowest === 6)) && (trump === 6)) lowest = 10 - lowest;
        Result = 13 + lowest;
      };
    } else if ($tmp === 5) {
      Result = 22 + lowest}
     else if ($tmp === 6) {
      Result = 27 + lowest}
     else if ($tmp === 7) {
      Result = 31 + lowest}
     else if ($tmp === 8) {
      Result = 34 + lowest}
     else if ($tmp === 9) Result = 37;
    return Result;
  };
  this.InitSWSRalphJasser = function (howMany) {
    var aMyJasser = null;
    var dummy = false;
    var i = 0;
    var j = 0;
    var saveRes = 0;
    var player = 0;
    var b = false;
    function ReadCard(index, card) {
      card.set($impl.datafinal[index.get()]);
      index.set(index.get() + 1);
    };
    function ReadInteger(index, value) {
      var lo = 0;
      var hi = 0;
      hi = $impl.datafinal[index.get()];
      index.set(index.get() + 1);
      lo = $impl.datafinal[index.get()];
      index.set(index.get() + 1);
      value.set((256 * (hi % 128)) + lo);
      if (hi > 127) value.set(value.get() - 32768);
    };
    function ReadLong(index, value) {
      var lo = 0;
      var hi = 0;
      ReadInteger(index,{get: function () {
          return hi;
        }, set: function (v) {
          hi = v;
        }});
      ReadInteger(index,{get: function () {
          return lo;
        }, set: function (v) {
          lo = v;
        }});
      value.set((32768 * hi) + lo);
    };
    function ReadReal(index, value) {
      var whole = 0;
      var fraction = 0;
      ReadInteger(index,{get: function () {
          return whole;
        }, set: function (v) {
          whole = v;
        }});
      ReadInteger(index,{get: function () {
          return fraction;
        }, set: function (v) {
          fraction = v;
        }});
      value.set(whole + 0.5 + (fraction / 65536));
    };
    function binom(n, k) {
      var Result = 0;
      var resultHand = 0;
      var i = 0;
      resultHand = 1;
      for (var $l = n, $end = (n + 1) - k; $l >= $end; $l--) {
        i = $l;
        resultHand = rtl.trunc((resultHand * i) / ((n + 1) - i));
      };
      Result = resultHand;
      return Result;
    };
    $mod.Powers[0] = 1;
    for (i = 1; i <= 8; i++) $mod.Powers[i] = 2 * $mod.Powers[i - 1];
    for (i = 0; i <= 27; i++) for (var $l = 0, $end = i; $l <= $end; $l++) {
      j = $l;
      $mod.bin[i][j] = binom(i,j);
    };
    for (var $l1 = 1, $end1 = howMany; $l1 <= $end1; $l1++) {
      i = $l1;
      aMyJasser = $mod.TMyJasser.$create("IJassHandler$2",[0]);
      pas.SWSPlay.DeclareHandler(aMyJasser,"Grumpy");
    };
    $mod.FileInfo = $mod.TFileData.$new();
    if ($mod.FileInfo === null) pas.StdUtils.halt();
    $impl.GrumpyRnd = pas.SWSBase.NewRnd("Grumpy");
    $impl.filename = pas.PcFiles.GetDataPath() + $impl.kDatName;
    for ($impl.index = 0; $impl.index <= 48015; $impl.index++) $impl.datafinal[$impl.index] = $mod.PortData[$impl.index];
    $impl.index = 0;
    for (i = 0; i <= 4095; i++) {
      ReadReal({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $impl.FileInfo2[i], get: function () {
          return this.p.value;
        }, set: function (v) {
          this.p.value = v;
        }});
      ReadCard({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $impl.FileInfo2[i], get: function () {
          return this.p.card;
        }, set: function (v) {
          this.p.card = v;
        }});
    };
    for (var $l2 = 0; $l2 <= 1; $l2++) {
      b = $l2 !== 0;
      for (i = 0; i <= 639; i++) {
        ReadReal({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo.Trumpf[+b][i], get: function () {
            return this.p.expect;
          }, set: function (v) {
            this.p.expect = v;
          }});
        ReadLong({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo.Trumpf[+b][i], get: function () {
            return this.p.count;
          }, set: function (v) {
            this.p.count = v;
          }});
      };
    };
    for (var $l3 = 0; $l3 <= 1; $l3++) {
      b = $l3 !== 0;
      for (i = 0; i <= 37; i++) {
        ReadReal({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo.Wyss[+b][i], get: function () {
            return this.p.expect;
          }, set: function (v) {
            this.p.expect = v;
          }});
        ReadLong({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo.Wyss[+b][i], get: function () {
            return this.p.count;
          }, set: function (v) {
            this.p.count = v;
          }});
      };
    };
    for (i = 0; i <= 1023; i++) {
      ReadReal({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $mod.FileInfo.Schieben.cards[i], get: function () {
          return this.p.expect;
        }, set: function (v) {
          this.p.expect = v;
        }});
      ReadLong({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $mod.FileInfo.Schieben.cards[i], get: function () {
          return this.p.count;
        }, set: function (v) {
          this.p.count = v;
        }});
    };
    for (i = 0; i <= 37; i++) {
      ReadReal({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $mod.FileInfo.Schieben.wyss[i], get: function () {
          return this.p.expect;
        }, set: function (v) {
          this.p.expect = v;
        }});
      ReadLong({p: $impl, get: function () {
          return this.p.index;
        }, set: function (v) {
          this.p.index = v;
        }},{p: $mod.FileInfo.Schieben.wyss[i], get: function () {
          return this.p.count;
        }, set: function (v) {
          this.p.count = v;
        }});
    };
    for (var $l4 = 0; $l4 <= 1; $l4++) {
      b = $l4 !== 0;
      for (i = 0; i <= 1023; i++) {
        ReadInteger({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo3[+b][i], get: function () {
            return this.p.value;
          }, set: function (v) {
            this.p.value = v;
          }});
        ReadInteger({p: $impl, get: function () {
            return this.p.index;
          }, set: function (v) {
            this.p.index = v;
          }},{p: $mod.FileInfo3[+b][i], get: function () {
            return this.p.card;
          }, set: function (v) {
            this.p.card = v;
          }});
      };
    };
  };
  this.FreeSWSRalphJasser = function () {
  };
  this.$rtti.$Pointer("FileInfo$a",{reftype: this.$rtti["TFileData"]});
  this.FileInfo = null;
  this.FileInfo3 = rtl.arraySetLength(null,this.TPortRecord1,2,1024);
  this.$rtti.$StaticArray("Powers$a",{dims: [9], eltype: rtl.longint});
  this.Powers = rtl.arraySetLength(null,0,9);
  this.bin$a$clone = function (a) {
    var b = [];
    b.length = 28;
    for (var c = 0; c < 28; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("bin$a",{dims: [28,28], eltype: rtl.longint});
  this.bin = rtl.arraySetLength(null,0,28,28);
  this.$rtti.$StaticArray("CurrentRank$a",{dims: [37], eltype: rtl.longint});
  this.CurrentRank = rtl.arraySetLength(null,0,37);
  this.$rtti.$StaticArray("CardValues$a",{dims: [37], eltype: rtl.longint});
  this.CardValues = rtl.arraySetLength(null,0,37);
  this.CardBetter$a$clone = function (a) {
    var b = [];
    b.length = 37;
    for (var c = 0; c < 37; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("CardBetter$a",{dims: [37,37], eltype: rtl.boolean});
  this.CardBetter = rtl.arraySetLength(null,false,37,37);
  this.$rtti.$StaticArray("IsGrumpy$a",{dims: [5], eltype: rtl.boolean});
  this.IsGrumpy = rtl.arraySetLength(null,false,5);
  this.$rtti.$StaticArray("PlayLevel$a",{dims: [5], eltype: rtl.longint});
  this.PerfectPlay = rtl.arraySetLength(null,0,5);
  this.PlayLevel = rtl.arraySetLength(null,0,5);
  this.HashCodes$a$clone = function (a) {
    var b = [];
    b.length = 5;
    for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
    return b;
  };
  this.$rtti.$StaticArray("HashCodes$a",{dims: [5,37], eltype: rtl.longint});
  this.HashCodes = rtl.arraySetLength(null,0,5,37);
  this.HashTable$a$clone = function (a) {
    var b = [];
    b.length = 1;
    for (var c = 0; c < 1; c++) b[c] = $mod.HashEntry.$clone(a[c]);
    return b;
  };
  this.$rtti.$StaticArray("HashTable$a",{dims: [1], eltype: this.$rtti["HashEntry"]});
  this.HashTable = rtl.arraySetLength(null,this.HashEntry,1);
  $mod.$implcode = function () {
    $impl.kDatName = "RUGD7000.DAT";
    $impl.GrumpyRnd = 0;
    $impl.FileInfo2 = rtl.arraySetLength(null,$mod.TPortRecord0,4096);
    $impl.NrBoeck = function (lead, optimistic, player, play, hand) {
      var Result = 0;
      var i = 0;
      var temp = 0;
      var total = 0;
      var res = 0;
      var best = 0;
      var j = 0;
      var winner = 0;
      var nextplay = rtl.arraySetLength(null,0,5);
      var try1 = rtl.arraySetLength(null,0,9);
      var some = false;
      if (player === 1) {
        res = -1}
       else res = 10;
      some = false;
      total = 0;
      i = 0;
      while (i <= 8) {
        some = some || (hand[i] === 1);
        if (hand[i] === player) {
          total += 1;
          try1[total] = i + 1;
          while (((i + 1) <= 8) && (hand[i + 1] === player)) i += 1;
        };
        i += 1;
      };
      if (!lead) some = true;
      best = -1;
      for (j = 1; j <= 4; j++) {
        nextplay[j] = -1;
        if (play[j] > best) {
          best = play[j];
          winner = j;
        };
      };
      if (optimistic && (total > 1) && (try1[total] > best) && (((winner === 1) && (player !== 1)) || (pas.SWSBase.gTeamOf[winner] !== pas.SWSBase.gTeamOf[player]))) {
        j = 1;
        while (try1[j] <= best) j += 1;
        for (var $l = 1, $end = (total - j) + 1; $l <= $end; $l++) {
          i = $l;
          try1[i] = try1[(i + j) - 1];
        };
        total = (total - j) + 1;
      };
      if (((total === 0) || !some) && (best === -1)) {
        Result = 0;
      } else if (total === 0) {
        if (play[pas.SWSBase.gNextPlayer[player]] >= 0) {
          res = $impl.NrBoeck(lead,optimistic,winner,nextplay.slice(0),hand.slice(0));
          if (winner === 1) res += 1;
        } else {
          play[player] = 0;
          res = $impl.NrBoeck(lead,optimistic,pas.SWSBase.gNextPlayer[player],play.slice(0),hand.slice(0));
        };
        Result = res;
      } else {
        for (var $l1 = 1, $end1 = total; $l1 <= $end1; $l1++) {
          i = $l1;
          hand[try1[i] - 1] = 0;
          if (play[pas.SWSBase.gNextPlayer[player]] >= 0) {
            if (try1[i] > best) winner = player;
            temp = $impl.NrBoeck(lead,optimistic,winner,nextplay.slice(0),hand.slice(0));
            if (winner === 1) temp += 1;
          } else {
            play[player] = try1[i];
            temp = $impl.NrBoeck(lead,optimistic,pas.SWSBase.gNextPlayer[player],play.slice(0),hand.slice(0));
          };
          hand[try1[i] - 1] = player;
          if ((temp > res) && (player === 1)) {
            res = temp;
          } else if ((temp < res) && (player !== 1)) {
            res = temp;
          };
        };
        Result = res;
      };
      return Result;
    };
    $impl.GetLower = function (stichcard, Acard, highpoints, CardsInGame) {
      var Result = {};
      var answer = {};
      var i = 0;
      var allcards = 0;
      answer = {};
      for (i = 1; i <= 9; i++) {
        allcards = pas.SWSBase.gCardOf[pas.SWSBase.gColourOf[Acard]][i];
        if (!$mod.CardBetter[stichcard][allcards] && ($mod.CardBetter[allcards][Acard] || $mod.Adjacent(allcards,Acard,CardsInGame))) {
          if (highpoints && ($mod.CardValues[allcards] > $mod.CardValues[Acard])) {
            answer = rtl.unionSet(answer,rtl.createSet(allcards))}
           else if (!highpoints && ($mod.CardValues[allcards] < $mod.CardValues[Acard])) answer = rtl.unionSet(answer,rtl.createSet(allcards));
        };
      };
      Result = rtl.refSet(answer);
      return Result;
    };
    $impl.GetHigher = function (Acard, color) {
      var Result = {};
      var answer = {};
      var i = 0;
      answer = {};
      for (i = 1; i <= 9; i++) if ($mod.CardBetter[Acard][pas.SWSBase.gCardOf[color][i]]) answer = rtl.unionSet(answer,rtl.createSet(pas.SWSBase.gCardOf[color][i]));
      Result = rtl.refSet(answer);
      return Result;
    };
    $mod.$rtti.$StaticArray("TData",{dims: [48016], eltype: rtl.byte});
    $impl.datafinal = rtl.arraySetLength(null,0,48016);
    $impl.index = 0;
    $impl.filename = "";
    var HasCards$a$clone = function (a) {
      var b = [];
      b.length = 5;
      for (var c = 0; c < 5; c++) b[c] = a[c].slice(0);
      return b;
    };
    $impl.NewBockErwartung = function (full, usetrumpstich, Color, stich, mustwin, stichplayer, fPlayer, fHasAtLeast, mylegal, fTrump, fProbableView, NewTrick, fCount) {
      var Result = 0.0;
      var allcards = 0;
      var i = 0;
      var j = 0;
      var k = 0;
      var which = 0;
      var This = 0;
      var variant = 0;
      var realrank = 0;
      var iresult = 0;
      var count = 0;
      var special = rtl.arraySetLength(null,0,9);
      var amount = rtl.arraySetLength(null,0,5);
      var bestcard = 0;
      var better = 0;
      var player = 0;
      var player2 = 0;
      var usehash = false;
      var oldusehash = false;
      var calc = false;
      var checkit = false;
      var HasCards = rtl.arraySetLength(null,false,5,9);
      var realcard = rtl.arraySetLength(null,0,9);
      var average = rtl.arraySetLength(null,0,10);
      var sample = 0;
      var totalcount = 0;
      var HasAtMost = rtl.arraySetLength(null,0,5);
      var SureCards = {};
      function Erwartung(stich, leadplayer, stichplayer, player) {
        var Result = 0;
        var i = 0;
        var max = 0;
        var other = 0;
        var next = 0;
        var nextwin = 0;
        var help = 0;
        var best = 0;
        var expect = 0;
        var winTeam = 0;
        next = pas.SWSBase.gNextPlayer[player];
        while ((next !== leadplayer) && (amount[next] === 0)) next = pas.SWSBase.gNextPlayer[next];
        if (amount[player] === 0) {
          best = 0;
          if (amount[next] !== 0) {
            best = Erwartung(stich,leadplayer,stichplayer,next);
            if (pas.SWSBase.gTeamOf[next] !== pas.SWSBase.gTeamOf[player]) best = -best;
          };
        } else {
          best = -99;
          amount[player] = amount[player] - 1;
          count -= 1;
          checkit = true;
          for (i = 0; i <= 8; i++) {
            if ((special[i] === player) && checkit) {
              if (stich <= i) {
                stichplayer = player;
                stich = i + 1;
              };
              special[i] = 0;
              if (next === leadplayer) {
                expect = 0;
                if ((amount[stichplayer] > 0) || full) {
                  other = 8;
                  while ((other > 0) && (special[other] === 0)) other -= 1;
                  nextwin = special[other];
                  if (amount[nextwin] === count) {
                    if (pas.SWSBase.gTeamOf[nextwin] === pas.SWSBase.gTeamOf[stichplayer]) {
                      expect = count}
                     else expect = -count;
                  } else {
                    max = 0;
                    do {
                      if (special[other] === nextwin) max += 1;
                      other -= 1;
                    } while (!((other < 0) || !((special[other] === 0) || (special[other] === nextwin) || (amount[special[other]] <= max))));
                    if (amount[nextwin] === max) {
                      if (full && (other >= 0)) {
                        expect = Erwartung(0,stichplayer,0,stichplayer);
                      } else {
                        if (pas.SWSBase.gTeamOf[nextwin] === pas.SWSBase.gTeamOf[stichplayer]) {
                          expect = max}
                         else expect = -max;
                      };
                    } else {
                      other = 0;
                      for (help = 1; help <= 4; help++) if ((pas.SWSBase.gTeamOf[help] !== pas.SWSBase.gTeamOf[nextwin]) && (amount[help] > other)) other = amount[help];
                      if (max >= other) {
                        if (amount[nextwin] < amount[pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[nextwin]]]) nextwin = pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[nextwin]];
                        if (pas.SWSBase.gTeamOf[nextwin] === pas.SWSBase.gTeamOf[stichplayer]) {
                          expect = amount[nextwin]}
                         else expect = -amount[nextwin];
                      } else expect = Erwartung(0,stichplayer,0,stichplayer);
                    };
                  };
                };
                expect += 1;
                winTeam = pas.SWSBase.gTeamOf[stichplayer];
              } else {
                expect = Erwartung(stich,leadplayer,stichplayer,next);
                winTeam = pas.SWSBase.gTeamOf[next];
              };
              if (winTeam !== pas.SWSBase.gTeamOf[player]) expect = -expect;
              special[i] = player;
              checkit = false;
              if (expect > best) best = expect;
            } else if ((special[i] !== player) && ((special[i] !== 0) || ((i + 1) === stich))) {
              checkit = true;
            };
          };
          amount[player] = amount[player] + 1;
          count += 1;
        };
        Result = best;
        return Result;
      };
      function Distrib(which) {
        var ok = false;
        var checkit = false;
        var player = 0;
        var winner = 0;
        var next = 0;
        var newstich = 0;
        var i = 0;
        var lastcard = 0;
        var winTeam = 0;
        while ((which < 9) && HasCards[0][which]) which += 1;
        if (which < 9) {
          player = fPlayer;
          do {
            if (HasCards[player][which]) {
              special[which] = player;
              amount[player] = amount[player] + 1;
              if (HasAtMost[player] >= amount[player]) Distrib(which + 1);
              amount[player] = amount[player] - 1;
            };
            player = pas.SWSBase.gNextPlayer[player];
          } while (!(player === fPlayer));
        } else {
          ok = true;
          for (player = 1; player <= 4; player++) ok = ok && (fHasAtLeast.get()[player][Color] <= amount[player]);
          if (ok && (totalcount === sample)) {
            totalcount = 0;
            next = pas.SWSBase.gNextPlayer[fPlayer];
            while ((next !== NewTrick.fLeading) && (amount[next] === 0)) next = pas.SWSBase.gNextPlayer[next];
            amount[fPlayer] = amount[fPlayer] - 1;
            count -= 1;
            checkit = true;
            newstich = realrank;
            winner = stichplayer;
            for (i = 0; i <= 8; i++) {
              if ((special[i] === fPlayer) && checkit) {
                if (realrank <= i) {
                  newstich = i + 1;
                  winner = fPlayer;
                };
                special[i] = 0;
                if (next === NewTrick.fLeading) {
                  lastcard = 0;
                  if ((amount[winner] > 0) || (full && (count > 0))) lastcard = Erwartung(0,winner,0,winner);
                  lastcard += 1;
                  winTeam = pas.SWSBase.gTeamOf[winner];
                } else {
                  lastcard = Erwartung(newstich,NewTrick.fLeading,winner,next);
                  winTeam = pas.SWSBase.gTeamOf[next];
                };
                if (winTeam !== pas.SWSBase.gTeamOf[fPlayer]) lastcard = -lastcard;
                special[i] = fPlayer;
                checkit = false;
              } else if ((special[i] !== fPlayer) && ((special[i] !== 0) || ((i + 1) === realrank))) {
                checkit = true;
              };
              if (special[i] === fPlayer) average[i] = average[i] + lastcard;
            };
            amount[fPlayer] = amount[fPlayer] + 1;
            count += 1;
            if (usetrumpstich) {
              if (next === NewTrick.fLeading) {
                if (amount[fPlayer] > 0) lastcard = 1 + Erwartung(0,fPlayer,0,fPlayer);
              } else {
                lastcard = Erwartung(10,NewTrick.fLeading,fPlayer,next);
                if (pas.SWSBase.gTeamOf[next] !== pas.SWSBase.gTeamOf[fPlayer]) lastcard = -lastcard;
              };
              average[9] = average[9] + lastcard;
            };
          } else if (ok) totalcount += 1;
        };
      };
      for (i = 0; i <= 4; i++) amount[i] = 0;
      for (i = 0; i <= 8; i++) special[i] = 0;
      for (i = 0; i <= 9; i++) average[i] = 0;
      usetrumpstich = usetrumpstich && (fPlayer !== NewTrick.fLeading) && ($mod.CountColorHand(mylegal,fTrump) > 0);
      realrank = 0;
      if (stich !== 0) realrank = 1 + $mod.CurrentRank[stich];
      count = 0;
      variant = 1;
      for (This = 1; This <= 9; This++) {
        allcards = pas.SWSBase.gCardOf[Color][This];
        j = $mod.CurrentRank[allcards];
        k = 0;
        for (player = 1; player <= 4; player++) if (allcards in fProbableView.get()[player - 1]) {
          k += 1;
          HasCards[player][j] = true;
        } else HasCards[player][j] = false;
        HasCards[0][j] = k === 0;
        if (k > 0) {
          variant = variant * k;
          count += 1;
        };
      };
      for (player = 1; player <= 4; player++) {
        SureCards = rtl.refSet(fProbableView.get()[player - 1]);
        for (player2 = 1; player2 <= 4; player2++) if (player2 !== player) SureCards = rtl.diffSet(SureCards,fProbableView.get()[player2 - 1]);
        k = rtl.trunc(fCount / 4);
        if (NewTrick.fPlayed[player] !== 0) k += 1;
        HasAtMost[player] = (9 - k - $mod.CountCards({get: function () {
            return SureCards;
          }, set: function (v) {
            SureCards = v;
          }})) + $mod.CountColorCards({get: function () {
            return SureCards;
          }, set: function (v) {
            SureCards = v;
          }},Color);
      };
      usehash = fPlayer === NewTrick.fLeading;
      This = 0;
      while (usehash && (This <= 8)) {
        if (!(HasCards[0][This] || HasCards[fPlayer][This])) for (player = 1; player <= 4; player++) if ((player !== fPlayer) && !HasCards[player][This]) usehash = false;
        This += 1;
      };
      calc = false;
      oldusehash = false;
      if (usehash) {
        which = 0;
        j = 0;
        for (i = 0; i <= 8; i++) {
          realcard[j] = i;
          if (!HasCards[0][i]) {
            if (HasCards[fPlayer][i]) which = which + $mod.Powers[j];
            j += 1;
          };
        };
        for (var $l = j; $l <= 8; $l++) {
          i = $l;
          realcard[i] = -1;
        };
        var $tmp = j;
        if ($tmp === 0) {
          which = which + 1022}
         else if ($tmp === 1) {
          which = which + 1020}
         else if ($tmp === 2) {
          which = which + 1016}
         else if ($tmp === 3) {
          which = which + 1008}
         else if ($tmp === 4) {
          which = which + 992}
         else if ($tmp === 5) {
          which = which + 960}
         else if ($tmp === 6) {
          which = which + 896}
         else if ($tmp === 7) {
          which = which + 768}
         else if ($tmp === 8) {
          which = which + 512}
         else if ($tmp === 9) which = which + 0;
        calc = $mod.FileInfo3[+full][which].value === -100;
      };
      if (!usehash || calc) {
        sample = 0;
        if (!(calc || oldusehash)) sample = rtl.trunc(variant / 100);
        variant = rtl.trunc(variant / (sample + 1));
        totalcount = 0;
        Distrib(0);
        if (mustwin !== 0) {
          for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[mylegal.get()[i]] === Color) {
            j = $mod.CurrentRank[mylegal.get()[i]];
            if (pas.SWSBase.gTeamOf[fPlayer] === pas.SWSBase.gTeamOf[mustwin]) {
              average[j] = average[j] + rtl.trunc((variant * $mod.CardValues[mylegal.get()[i]]) / 50)}
             else average[j] = average[j] - rtl.trunc((variant * $mod.CardValues[mylegal.get()[i]]) / 50);
          };
        };
      } else {
        bestcard = $mod.FileInfo3[+full][which].value;
        iresult = $mod.FileInfo3[+full][which].card;
        k = 0;
        while (iresult > 0) {
          if ((iresult % 2) === 1) average[realcard[k]] = bestcard;
          iresult = rtl.trunc(iresult / 2);
          k += 1;
        };
        usetrumpstich = false;
        usehash = false;
      };
      better = -2147483647;
      bestcard = -2147483647;
      for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[mylegal.get()[i]] === Color) {
        j = $mod.CurrentRank[mylegal.get()[i]];
        if (average[j] > bestcard) bestcard = average[j];
        if ((average[j] > better) && (j > realrank)) better = average[j];
      };
      if (usetrumpstich && ((average[9] - (2.05 * variant)) > bestcard)) bestcard = 2147483647;
      for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[mylegal.get()[i]] === Color) {
        j = $mod.CurrentRank[mylegal.get()[i]];
        if (average[j] !== bestcard) mylegal.get()[i] = 0;
      };
      if (usehash) {
        iresult = 0;
        for (i = 0; i <= 8; i++) if (pas.SWSBase.gColourOf[mylegal.get()[i]] === Color) {
          j = $mod.CurrentRank[mylegal.get()[i]];
          for (k = 0; k <= 8; k++) if (realcard[k] === j) iresult = iresult + $mod.Powers[k];
        };
        $mod.FileInfo3[+full][which].value = bestcard;
        $mod.FileInfo3[+full][which].card = iresult;
      };
      Result = bestcard / variant;
      return Result;
    };
    $impl.BestTrump = function (fRules, fPoints, fPlayer, fhand, shiftable, trump, fBestWyss) {
      var suit = pas.SWSBase.TSuits.$new();
      var try1 = 0;
      var try2 = 0;
      var max = 0.0;
      var i = 0;
      var j = 0;
      var value = 0;
      var adr = 0;
      var wyss = 0;
      var points = 0.0;
      var oppPoints = 0.0;
      var ourPoints = 0.0;
      var shiftamount = 0.0;
      var normalize = 0.0;
      var specialmax = 0.0;
      var specialpoints = 0.0;
      var specialtrump = 0;
      var specialwyss = 0;
      max = -2570;
      specialmax = -2570;
      specialtrump = 0;
      for (try1 = 1; try1 <= 6; try1++) if (fRules.fTrumpFactor[try1] > 0) {
        value = 0;
        pas.SWSBase.GetBestSuit(pas.SWSBase.TRules.$clone(fRules),try1,fhand.slice(0),suit);
        wyss = 0;
        if (suit.fCount > 0) {
          for (var $l = 1, $end = suit.fCount - 1; $l <= $end; $l++) {
            i = $l;
            if (suit.fCalls[wyss].fValue <= suit.fCalls[i].fValue) wyss = i;
          };
          wyss = $mod.GetWyssAdr(try1,{p: suit.fCalls[wyss], get: function () {
              return this.p.fCards;
            }, set: function (v) {
              this.p.fCards = v;
            }});
        };
        points = 0;
        for (try2 = 1; try2 <= 4; try2++) {
          j = $mod.GetAdr(try1,try2,fhand.slice(0));
          points = points + $mod.FileInfo.Trumpf[+!shiftable][j].expect;
        };
        if (Math.abs(points) > 157) {
          oppPoints = (257 - points) / 2}
         else oppPoints = (157 - points) / 2;
        ourPoints = oppPoints + points;
        if ($mod.FileInfo.Wyss[+!shiftable][wyss].expect >= 0) {
          ourPoints = ourPoints + $mod.FileInfo.Wyss[+!shiftable][wyss].expect}
         else oppPoints = oppPoints - $mod.FileInfo.Wyss[+!shiftable][wyss].expect;
        ourPoints = ourPoints * fRules.fTrumpFactor[try1];
        oppPoints = oppPoints * fRules.fTrumpFactor[try1];
        points = fRules.fTrumpFactor[try1] * (points + $mod.FileInfo.Wyss[+!shiftable][wyss].expect);
        if (fRules.fPointPlay) {
          ourPoints = fPoints[pas.SWSBase.gTeamOf[fPlayer]] + ourPoints;
          oppPoints = fPoints[pas.SWSBase.gTeamOf[pas.SWSBase.gNextPlayer[fPlayer]]] + oppPoints;
          specialpoints = points;
          if ((ourPoints >= (fRules.fLimit + (fRules.fTrumpFactor[try1] * 25))) && (oppPoints < fRules.fLimit)) specialpoints = (points + ourPoints) - fRules.fLimit;
          if (specialpoints > specialmax) {
            specialmax = specialpoints;
            specialtrump = try1;
            specialwyss = wyss;
          };
        };
        if (points > max) {
          max = points;
          trump.set(try1);
          fBestWyss.set(wyss);
        };
      };
      if (shiftable) {
        pas.SWSBase.GetBestSuit(pas.SWSBase.TRules.$clone(fRules),5,fhand.slice(0),suit);
        wyss = 0;
        if (suit.fCount > 0) {
          for (var $l1 = 1, $end1 = suit.fCount - 1; $l1 <= $end1; $l1++) {
            i = $l1;
            if (suit.fCalls[wyss].fValue <= suit.fCalls[i].fValue) wyss = i;
          };
          wyss = $mod.GetWyssAdr(5,{p: suit.fCalls[wyss], get: function () {
              return this.p.fCards;
            }, set: function (v) {
              this.p.fCards = v;
            }});
        };
        normalize = 0.0;
        for (try2 = 1; try2 <= 6; try2++) normalize = normalize + fRules.fTrumpFactor[try2];
        shiftamount = 0;
        for (try2 = 1; try2 <= 4; try2++) {
          adr = $mod.GetShiftAdr(pas.SWSBase.TRules.$clone(fRules),try2,fhand.slice(0));
          shiftamount = shiftamount + $mod.FileInfo.Schieben.cards[adr].expect;
        };
        shiftamount = (shiftamount * normalize) / 12.0;
        shiftamount = shiftamount + (($mod.FileInfo.Schieben.wyss[wyss].expect * normalize) / 12.0);
        if (max < shiftamount) {
          fBestWyss.set(-1);
          trump.set(0);
        };
      };
      if ((trump.get() !== 0) && (specialtrump !== 0)) {
        trump.set(specialtrump);
        fBestWyss.set(specialwyss);
      };
    };
    $impl.Throw = function (schmier, fTrump, fPlayer, fTrumpPlayer, NewTrick, fProbableView, fWantColor, throwhand, totalhand) {
      var Result = 0;
      var OKColor = rtl.arraySetLength(null,false,5);
      var player = 0;
      var i = 0;
      var diff = 0;
      var werfcard = 0;
      var dumb = 0;
      var cost = 0.0;
      var bestcost = 0.0;
      var actual = 0.0;
      var colorvalue = rtl.arraySetLength(null,0.0,5);
      var cardcolor = 0;
      var colors = 0;
      var best = 0;
      var reset = false;
      var restcards = {};
      var cardsInGame = {};
      var boeck = rtl.arraySetLength(null,0,9);
      var temp = rtl.arraySetLength(null,0,9);
      cardsInGame = {};
      for (player = 1; player <= 4; player++) cardsInGame = rtl.unionSet(cardsInGame,fProbableView.get()[player - 1]);
      restcards = rtl.diffSet(cardsInGame,fProbableView.get()[fPlayer - 1]);
      reset = true;
      if ((NewTrick.fLeading !== fPlayer) && (fWantColor[fPlayer] === 0) && (fTrumpPlayer === pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fPlayer]])) {
        temp = throwhand.slice(0);
        if (fTrump < 5) for (i = 0; i <= 8; i++) if (temp[i] === pas.SWSBase.gCardOf[fTrump][6]) temp[i] = 0;
        if ($mod.CountColorHand({get: function () {
            return temp;
          }, set: function (v) {
            temp = v;
          }},pas.SWSBase.gColourOf[NewTrick.fPlayed[NewTrick.fLeading]]) === 0) {
          boeck = $mod.AllBoeckHand(fTrump,{get: function () {
              return temp;
            }, set: function (v) {
              temp = v;
            }},rtl.refSet(restcards));
          for (colors = 1; colors <= 4; colors++) {
            OKColor[colors] = false;
            if ($mod.CountColorHand({get: function () {
                return temp;
              }, set: function (v) {
                temp = v;
              }},colors) > 0) {
              best = colors;
              do {
                if (best === 4) best = 0;
                best += 1;
              } while (!((best === colors) || ((best !== fTrump) && ($mod.CountColorHand({get: function () {
                  return temp;
                }, set: function (v) {
                  temp = v;
                }},best) > 0))));
              if (($mod.CountColorHand({get: function () {
                  return boeck;
                }, set: function (v) {
                  boeck = v;
                }},best) > 0) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fPlayer]] - 1, p: fProbableView.get(), get: function () {
                  return this.p[this.a];
                }, set: function (v) {
                  this.p[this.a] = v;
                }},best) > 0)) {
                OKColor[colors] = true;
                reset = false;
              };
            };
          };
        };
      };
      werfcard = 0;
      for (colors = 1; colors <= 4; colors++) {
        colorvalue[colors] = -1;
        if (reset) OKColor[colors] = true;
      };
      for (i = 0; i <= 8; i++) {
        if ((throwhand[i] !== 0) && OKColor[pas.SWSBase.gColourOf[throwhand[i]]]) {
          cardcolor = pas.SWSBase.gColourOf[throwhand[i]];
          if (colorvalue[cardcolor] === -1) colorvalue[cardcolor] = $mod.BockErwartung({get: function () {
              return totalhand;
            }, set: function (v) {
              totalhand = v;
            }},{get: function () {
              return restcards;
            }, set: function (v) {
              restcards = v;
            }},cardcolor,true,false,{get: function () {
              return dumb;
            }, set: function (v) {
              dumb = v;
            }});
          totalhand[i] = 0;
          actual = $mod.BockErwartung({get: function () {
              return totalhand;
            }, set: function (v) {
              totalhand = v;
            }},{get: function () {
              return restcards;
            }, set: function (v) {
              restcards = v;
            }},cardcolor,true,false,{get: function () {
              return dumb;
            }, set: function (v) {
              dumb = v;
            }});
          totalhand[i] = throwhand[i];
          cost = colorvalue[cardcolor] - actual;
          if (cardcolor === fTrump) {
            cost = cost + 10}
           else if ((cost > 0) && (actual < 0.5)) {
            if (!schmier && (pas.SWSBase.gTeamOf[fTrumpPlayer] !== pas.SWSBase.gTeamOf[fPlayer])) {
              cost = cost + 1;
              if ($mod.CountColorCards({get: function () {
                  return restcards;
                }, set: function (v) {
                  restcards = v;
                }},cardcolor) === 0) cost = cost - 2;
            } else if (cost === 1) {
              cost = cost + 1;
              if ($mod.CountColorCards({get: function () {
                  return restcards;
                }, set: function (v) {
                  restcards = v;
                }},cardcolor) === 0) cost = cost - 0.5;
            };
          };
          if (werfcard === 0) {
            werfcard = throwhand[i];
            bestcost = cost;
          } else {
            diff = $mod.CardValues[throwhand[i]] - $mod.CardValues[werfcard];
            if (schmier) diff = -diff;
            if ((50 * (bestcost - cost)) >= diff) {
              if ((cost === bestcost) && (diff === 0)) {
                if (cardcolor === pas.SWSBase.gColourOf[werfcard]) {
                  if ($mod.CardBetter[throwhand[i]][werfcard]) werfcard = throwhand[i];
                } else if (colorvalue[cardcolor] < colorvalue[pas.SWSBase.gColourOf[werfcard]]) {
                  werfcard = throwhand[i];
                };
              } else {
                werfcard = throwhand[i];
                bestcost = cost;
              };
            };
          };
        };
      };
      Result = werfcard;
      return Result;
    };
    $impl.Provable = function (fTrump, fPlayer, NewTrick, fView, mylegal) {
      var realrest = {};
      var restcards = {};
      var abort = false;
      var noTrumps = false;
      var ok = false;
      var i = 0;
      var j = 0;
      var k = 0;
      var allcards = 0;
      var player = 0;
      var partner = 0;
      var winner = 0;
      var found = 0;
      var stich = 0;
      winner = pas.SWSBase.WinnerOfTrick(fTrump,pas.SWSBase.TTrick.$clone(NewTrick));
      stich = NewTrick.fPlayed[winner];
      restcards = {};
      for (player = 1; player <= 4; player++) if (player !== fPlayer) restcards = rtl.unionSet(restcards,fView.get()[player - 1]);
      realrest = rtl.unionSet(restcards,rtl.createSet(stich));
      partner = pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fPlayer]];
      noTrumps = (fTrump >= 5) || (($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[fPlayer] - 1, p: fView.get(), get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }},fTrump) === 0) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[partner] - 1, p: fView.get(), get: function () {
          return this.p[this.a];
        }, set: function (v) {
          this.p[this.a] = v;
        }},fTrump) === 0));
      if (noTrumps) {
        for (i = 0; i <= 8; i++) if ($mod.CardBetter[stich][mylegal.get()[i]] && !$mod.CouldBeBetter(0,mylegal.get()[i],{get: function () {
            return realrest;
          }, set: function (v) {
            realrest = v;
          }})) {
          for (var $l = i + 1; $l <= 8; $l++) {
            j = $l;
            if ($mod.Adjacent(mylegal.get()[i],mylegal.get()[j],{get: function () {
                return realrest;
              }, set: function (v) {
                realrest = v;
              }})) {
              if ($mod.CardBetter[mylegal.get()[j]][mylegal.get()[i]]) {
                mylegal.get()[j] = 0}
               else mylegal.get()[i] = 0;
            };
          };
        };
      };
      if (NewTrick.fLeading === fPlayer) {
        found = 0;
        if (noTrumps || ($mod.CountColorCards({a: fPlayer - 1, p: fView.get(), get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }},fTrump) === 0)) {
          for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && (pas.SWSBase.gColourOf[mylegal.get()[i]] !== fTrump) && $mod.CardBetter[found][mylegal.get()[i]] && ($mod.CountColorCards({get: function () {
              return restcards;
            }, set: function (v) {
              restcards = v;
            }},pas.SWSBase.gColourOf[mylegal.get()[i]]) === 0)) found = mylegal.get()[i];
        };
        if (found !== 0) {
          for (i = 0; i <= 8; i++) if (mylegal.get()[i] !== found) mylegal.get()[i] = 0;
        } else if (noTrumps) {
          abort = false;
          for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && (pas.SWSBase.gColourOf[mylegal.get()[i]] !== fTrump)) abort = true;
          if (abort) for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump)) mylegal.get()[i] = 0;
          abort = false;
          for (i = 0; i <= 8; i++) if (!abort && (mylegal.get()[i] !== 0)) abort = $mod.CouldBeBetter(fTrump,mylegal.get()[i],{get: function () {
              return restcards;
            }, set: function (v) {
              restcards = v;
            }});
          if (!abort) {
            for (i = 0; i <= 8; i++) if (mylegal.get()[i] !== 0) for (var $l1 = i + 1; $l1 <= 8; $l1++) {
              j = $l1;
              if (mylegal.get()[j] !== 0) if ($mod.CardBetter[mylegal.get()[i]][mylegal.get()[j]]) {
                mylegal.get()[i] = 0}
               else mylegal.get()[j] = 0;
            };
          };
        };
      } else {
        ok = true;
        for (i = 1; i <= 4; i++) if ((i !== fPlayer) && (NewTrick.fPlayed[i] === 0) && (pas.SWSBase.gTeamOf[i] !== pas.SWSBase.gTeamOf[winner]) && $mod.CouldBeBetter(fTrump,stich,{a: i - 1, p: fView.get(), get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }})) ok = false;
        if (ok && (fTrump < 5) && (winner === partner)) {
          i = 0;
          while ((i <= 8) && ((mylegal.get()[i] === 0) || (mylegal.get()[i] === pas.SWSBase.gCardOf[fTrump][6]))) i += 1;
          if (i <= 8) for (i = 0; i <= 8; i++) if (mylegal.get()[i] === pas.SWSBase.gCardOf[fTrump][6]) mylegal.get()[i] = 0;
          i = 0;
          while ((i <= 8) && ((mylegal.get()[i] === 0) || (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump))) i += 1;
          if (i <= 8) for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump)) mylegal.get()[i] = 0;
        };
        abort = false;
        for (i = 0; i <= 8; i++) if (!abort && (mylegal.get()[i] !== 0)) {
          if ($mod.CardBetter[stich][mylegal.get()[i]]) {
            abort = true}
           else for (allcards = 1; allcards <= 36; allcards++) abort = abort || ((allcards in restcards) && $mod.CardBetter[allcards][mylegal.get()[i]]);
        };
        for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && $mod.CardBetter[mylegal.get()[i]][stich]) {
          for (var $l2 = i + 1; $l2 <= 8; $l2++) {
            j = $l2;
            if ((mylegal.get()[j] !== 0) && (mylegal.get()[i] !== 0) && $mod.CardBetter[mylegal.get()[j]][stich] && (!abort || $mod.Adjacent(mylegal.get()[i],mylegal.get()[j],{get: function () {
                return realrest;
              }, set: function (v) {
                realrest = v;
              }}))) {
              k = $mod.CardValues[mylegal.get()[i]] - $mod.CardValues[mylegal.get()[j]];
              if (k === 0) {
                mylegal.get()[j] = 0}
               else if (ok) {
                if ((winner === partner) === (k > 0)) {
                  mylegal.get()[j] = 0}
                 else mylegal.get()[i] = 0;
              };
            };
          };
        };
        if (ok && (winner !== partner)) {
          for (i = 0; i <= 8; i++) if ((mylegal.get()[i] !== 0) && $mod.CardBetter[mylegal.get()[i]][stich]) {
            for (j = 0; j <= 8; j++) if ((pas.SWSBase.gColourOf[mylegal.get()[j]] === pas.SWSBase.gColourOf[mylegal.get()[i]]) && $mod.CardBetter[mylegal.get()[j]][stich] && $mod.CardBetter[mylegal.get()[i]][mylegal.get()[j]] && ($mod.CardValues[mylegal.get()[i]] <= $mod.CardValues[mylegal.get()[j]])) {
              mylegal.get()[j] = 0;
            };
          };
        };
      };
    };
    $impl.PlayCard = function (fTrump, fPlayer, fTrumpPlayer, NewTrick, fWantColor, fMyView, fProbableView, fHasAtLeast, mylegal, templegal, fcount) {
      var Result = 0;
      var found = 0;
      var dumb = 0;
      var abockcard = 0;
      var stich = 0;
      var leadcard = 0;
      var ok = false;
      var i = 0;
      var j = 0;
      var k = 0;
      var temp = 0;
      var myhand = rtl.arraySetLength(null,0,9);
      var myboeck = rtl.arraySetLength(null,0,9);
      var hisboeck = rtl.arraySetLength(null,0,9);
      var templ = rtl.arraySetLength(null,0,9);
      var backuplegal = rtl.arraySetLength(null,0,9);
      var boeckHand = rtl.arraySetLength(null,0,9);
      var player = 0;
      var partner = 0;
      var newwinner = 0;
      var winner = 0;
      var restcards = {};
      var fCardsInGame = {};
      var PossibleCards = {};
      var help = {};
      var cost = 0.0;
      var bestcost = 0.0;
      var tcount = 0.0;
      var color = 0;
      var bestcolor = 0;
      var leadcolor = 0;
      var diff = 0;
      winner = pas.SWSBase.WinnerOfTrick(fTrump,pas.SWSBase.TTrick.$clone(NewTrick));
      stich = NewTrick.fPlayed[winner];
      found = 0;
      partner = pas.SWSBase.gNextPlayer[pas.SWSBase.gNextPlayer[fPlayer]];
      pas.SWSBase.CardSetToHand(rtl.refSet(fProbableView.get()[fPlayer - 1]),{get: function () {
          return myhand;
        }, set: function (v) {
          myhand = v;
        }});
      fCardsInGame = {};
      for (player = 1; player <= 4; player++) fCardsInGame = rtl.unionSet(fCardsInGame,fProbableView.get()[player - 1]);
      restcards = rtl.diffSet(fCardsInGame,fProbableView.get()[fPlayer - 1]);
      if (NewTrick.fLeading === fPlayer) {
        ok = fTrump < 5;
        if (!ok) {
          hisboeck = $mod.GetsStich(fTrump,fTrump,mylegal.get().slice(0),partner,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fMyView);
          ok = $mod.CountHand({get: function () {
              return hisboeck;
            }, set: function (v) {
              hisboeck = v;
            }}) > 0;
        };
        if (ok) {
          myboeck = $mod.GetsStich(0,fTrump,mylegal.get().slice(0),fPlayer,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView);
          for (i = 0; i <= 8; i++) {
            if (myboeck[i] !== 0) {
              if (found === 0) {
                found = myboeck[i]}
               else if (pas.SWSBase.gColourOf[found] === pas.SWSBase.gColourOf[myboeck[i]]) {
                if ($mod.CardBetter[found][myboeck[i]]) found = myboeck[i];
              } else if (pas.SWSBase.gColourOf[myboeck[i]] !== fTrump) {
                diff = 0;
                for (j = 0; j <= 8; j++) {
                  if (pas.SWSBase.gColourOf[myboeck[j]] === pas.SWSBase.gColourOf[found]) {
                    diff += 1}
                   else if (pas.SWSBase.gColourOf[myboeck[j]] === pas.SWSBase.gColourOf[myboeck[i]]) diff -= 1;
                };
                if ((pas.SWSBase.gColourOf[found] === fTrump) || (($mod.CountColorHand({get: function () {
                    return myhand;
                  }, set: function (v) {
                    myhand = v;
                  }},pas.SWSBase.gColourOf[found]) - $mod.CountColorHand({get: function () {
                    return myhand;
                  }, set: function (v) {
                    myhand = v;
                  }},pas.SWSBase.gColourOf[myboeck[i]])) > diff)) found = myboeck[i];
              };
            };
          };
          if ((found === 0) || (pas.SWSBase.gColourOf[found] === fTrump)) {
            hisboeck = $mod.GetsStich(fTrump,fTrump,mylegal.get().slice(0),partner,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fMyView);
            ok = $mod.CountHand({get: function () {
                return hisboeck;
              }, set: function (v) {
                hisboeck = v;
              }}) > 0;
            if (ok) {
              found = $impl.Throw(true,fTrump,fPlayer,fTrumpPlayer,pas.SWSBase.TTrick.$clone(NewTrick),fProbableView,fWantColor.slice(0),hisboeck.slice(0),templegal.get().slice(0));
            } else {
              hisboeck = $mod.GetsStich(fTrump,fTrump,mylegal.get().slice(0),partner,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView);
              ok = $mod.CountHand({get: function () {
                  return hisboeck;
                }, set: function (v) {
                  hisboeck = v;
                }}) > 0;
              if (ok) {
                found = $impl.Throw(true,fTrump,fPlayer,fTrumpPlayer,pas.SWSBase.TTrick.$clone(NewTrick),fProbableView,fWantColor.slice(0),hisboeck.slice(0),templegal.get().slice(0));
              } else if (found !== 0) {
                temp = $mod.CountColorHand(mylegal,fTrump);
                i = 0;
                j = 0;
                for (player = 1; player <= 4; player++) {
                  if (pas.SWSBase.gTeamOf[player] !== pas.SWSBase.gTeamOf[fPlayer]) {
                    k = $mod.CountColorCards({a: player - 1, p: fProbableView.get(), get: function () {
                        return this.p[this.a];
                      }, set: function (v) {
                        this.p[this.a] = v;
                      }},fTrump);
                    if (k > 0) {
                      i += 1;
                      if (j < k) j = k;
                    };
                  };
                };
                if ((i === 0) || ((i === 1) && (temp === 1) && ((temp < j) || ($mod.CountColorCards({a: partner - 1, p: fProbableView.get(), get: function () {
                    return this.p[this.a];
                  }, set: function (v) {
                    this.p[this.a] = v;
                  }},fTrump) > 0)))) found = 0;
              };
            };
          };
          if ((found === 0) && (fTrump < 5) && ($mod.CountColorHand({get: function () {
              return myhand;
            }, set: function (v) {
              myhand = v;
            }},fTrump) > 0)) {
            ok = true;
            PossibleCards = {};
            for (player = 1; player <= 4; player++) {
              if (pas.SWSBase.gTeamOf[player] !== pas.SWSBase.gTeamOf[fPlayer]) {
                PossibleCards = rtl.unionSet(PossibleCards,fProbableView.get()[player - 1]);
                ok = ok && ($mod.CountColorCards({a: player - 1, p: fProbableView.get(), get: function () {
                    return this.p[this.a];
                  }, set: function (v) {
                    this.p[this.a] = v;
                  }},fTrump) > 0);
              };
            };
            temp = $mod.CountColorCards({get: function () {
                return PossibleCards;
              }, set: function (v) {
                PossibleCards = v;
              }},fTrump);
            ok = (ok && (temp > 1) && ((fcount === 0) || (fTrumpPlayer === partner))) || (((temp > 1) || ((temp > 0) && !(pas.SWSBase.gCardOf[fTrump][6] in PossibleCards))) && (temp < $mod.CountColorHand({get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},fTrump)));
            if (ok) {
              for (i = 0; i <= 8; i++) {
                if (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump) {
                  if (found === 0) {
                    found = mylegal.get()[i]}
                   else if ((fcount === 0) && $mod.CardBetter[found][mylegal.get()[i]]) {
                    found = mylegal.get()[i]}
                   else if ((fcount > 0) && ($mod.CardValues[found] > $mod.CardValues[mylegal.get()[i]])) found = mylegal.get()[i];
                };
              };
            };
          };
        };
        if (found === 0) {
          bestcolor = 0;
          bestcost = -1000;
          for (color = 1; color <= 4; color++) {
            if ((color !== fTrump) && ($mod.CountColorHand(mylegal,color) > 0)) {
              cost = $impl.NewBockErwartung(((fPlayer === fTrumpPlayer) && (fcount < 12)) || (fcount === 0),false,color,0,0,0,fPlayer,fHasAtLeast,mylegal,fTrump,fProbableView,pas.SWSBase.TTrick.$clone(NewTrick),fcount);
              if (((color === fWantColor[pas.SWSBase.gNextPlayer[fPlayer]]) || (color === fWantColor[pas.SWSBase.gNextPlayer[partner]])) && !($mod.BockCard({get: function () {
                  return fCardsInGame;
                }, set: function (v) {
                  fCardsInGame = v;
                }},color) in fProbableView.get()[fPlayer - 1])) {
                cost = cost - 0.5;
              };
              if ((cost > bestcost) || ((cost === bestcost) && ($mod.CountColorHand({get: function () {
                  return myhand;
                }, set: function (v) {
                  myhand = v;
                }},color) > $mod.CountColorHand({get: function () {
                  return myhand;
                }, set: function (v) {
                  myhand = v;
                }},bestcolor)))) {
                found = 0;
                for (i = 0; i <= 8; i++) if ((pas.SWSBase.gColourOf[mylegal.get()[i]] === color) && ((found === 0) || ((cost > 0) && ($mod.CardValues[mylegal.get()[i]] > $mod.CardValues[found])) || ((cost < 0) && ($mod.CardValues[mylegal.get()[i]] < $mod.CardValues[found])))) found = mylegal.get()[i];
                bestcost = cost;
                bestcolor = color;
              };
            };
          };
          for (i = 0; i <= 8; i++) {
            if (pas.SWSBase.gColourOf[mylegal.get()[i]] === bestcolor) {
              if (found === 0) {
                found = mylegal.get()[i]}
               else if ($mod.Adjacent(found,mylegal.get()[i],{get: function () {
                  return restcards;
                }, set: function (v) {
                  restcards = v;
                }})) {
                abockcard = $mod.BockCard({get: function () {
                    return fCardsInGame;
                  }, set: function (v) {
                    fCardsInGame = v;
                  }},bestcolor);
                if (!$mod.CardBetter[mylegal.get()[i]][abockcard] || ($mod.CardBetter[found][abockcard] && ($mod.CardValues[found] > $mod.CardValues[mylegal.get()[i]]))) found = mylegal.get()[i];
              };
            };
          };
        };
      } else {
        leadcard = NewTrick.fPlayed[NewTrick.fLeading];
        leadcolor = pas.SWSBase.gColourOf[leadcard];
        if ((fcount === 2) && (fTrump >= 5) && ($mod.CurrentRank[leadcard] === 8)) {
          found = leadcard;
          if (fTrump === 5) {
            found = found - 1}
           else found = found + 1;
          if (!(found in fProbableView.get()[fPlayer - 1])) found = 0;
        };
        if (found === 0) {
          if ((leadcolor === pas.SWSBase.gColourOf[stich]) && ($mod.CountColorHand({get: function () {
              return myhand;
            }, set: function (v) {
              myhand = v;
            }},leadcolor) > 0)) {
            newwinner = 0;
            if (!$mod.CouldBeBetter(fTrump,stich,{get: function () {
                return restcards;
              }, set: function (v) {
                restcards = v;
              }})) newwinner = winner;
            backuplegal = mylegal.get().slice(0);
            if ((fTrump < 5) && (leadcolor !== fTrump) && ($mod.CountColorHand({get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},fTrump) > 0)) {
              cost = $impl.NewBockErwartung(false,true,leadcolor,stich,newwinner,winner,fPlayer,fHasAtLeast,mylegal,fTrump,fProbableView,pas.SWSBase.TTrick.$clone(NewTrick),fcount)}
             else if ($mod.CountColorHand({get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},leadcolor) > 1) cost = $impl.NewBockErwartung(leadcolor === fTrump,false,leadcolor,stich,newwinner,winner,fPlayer,fHasAtLeast,mylegal,fTrump,fProbableView,pas.SWSBase.TTrick.$clone(NewTrick),fcount);
            if ((fTrump < 5) && (pas.SWSBase.ValueOfTrick(fTrump,pas.SWSBase.TTrick.$clone(NewTrick)) > 15)) mylegal.set(backuplegal.slice(0));
          };
          ok = false;
          for (i = 0; i <= 8; i++) ok = ok || ((leadcolor === pas.SWSBase.gColourOf[mylegal.get()[i]]) && $mod.CardBetter[stich][mylegal.get()[i]]);
          if (ok && (leadcolor !== fTrump)) {
            myboeck = $mod.GetsStich(fTrump,fTrump,mylegal.get().slice(0),fPlayer,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView)}
           else myboeck = $mod.GetsStich(0,fTrump,mylegal.get().slice(0),fPlayer,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView);
          if ($mod.CountHand({get: function () {
              return myboeck;
            }, set: function (v) {
              myboeck = v;
            }}) > 0) {
            boeckHand = $mod.AllBoeckHand(0,{get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},rtl.refSet(restcards));
            templ = myboeck.slice(0);
            for (i = 0; i <= 8; i++) if (templ[i] !== 0) for (j = 0; j <= 8; j++) if (templ[i] === boeckHand[j]) templ[i] = 0;
            if ($mod.CountHand({get: function () {
                return templ;
              }, set: function (v) {
                templ = v;
              }}) > 0) myboeck = templ.slice(0);
            found = $impl.Throw(true,fTrump,fPlayer,fTrumpPlayer,pas.SWSBase.TTrick.$clone(NewTrick),fProbableView,fWantColor.slice(0),myboeck.slice(0),templegal.get().slice(0));
          };
        };
        if ((found === 0) || (pas.SWSBase.gColourOf[found] === fTrump)) {
          if (ok && (leadcolor !== fTrump)) {
            hisboeck = $mod.GetsStich(fTrump,fTrump,mylegal.get().slice(0),partner,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView)}
           else hisboeck = $mod.GetsStich(0,fTrump,mylegal.get().slice(0),partner,fPlayer,pas.SWSBase.TTrick.$clone(NewTrick),stich,fProbableView);
          abockcard = 0;
          ok = $mod.CountHand({get: function () {
              return hisboeck;
            }, set: function (v) {
              hisboeck = v;
            }}) > 0;
          if (ok) abockcard = $impl.Throw(true,fTrump,fPlayer,fTrumpPlayer,pas.SWSBase.TTrick.$clone(NewTrick),fProbableView,fWantColor.slice(0),hisboeck.slice(0),templegal.get().slice(0));
          if (abockcard !== 0) {
            found = abockcard}
           else if (pas.SWSBase.gColourOf[found] === fTrump) {
            if ((leadcolor === fTrump) || (!((NewTrick.fPlayed[partner] === 0) && ($mod.CountColorCards({a: partner - 1, p: fProbableView.get(), get: function () {
                return this.p[this.a];
              }, set: function (v) {
                this.p[this.a] = v;
              }},fTrump) > 0)) && (stich !== NewTrick.fPlayed[partner]))) {
              if (i < 10) {
                if (($mod.CountColorHand({get: function () {
                    return myhand;
                  }, set: function (v) {
                    myhand = v;
                  }},fTrump) <= 1) || ((12 * $mod.CountColorHand({get: function () {
                    return myhand;
                  }, set: function (v) {
                    myhand = v;
                  }},fTrump)) < (36 - fcount))) {
                  j = -1;
                  for (i = 0; i <= 8; i++) {
                    if (myhand[i] !== 0) if ((pas.SWSBase.gColourOf[myhand[i]] === fTrump) || !$mod.CouldBeBetter(0,myhand[i],{get: function () {
                        return restcards;
                      }, set: function (v) {
                        restcards = v;
                      }})) {
                      j += 1}
                     else j -= 1;
                  };
                  if (j < 0) {
                    found = 0;
                  };
                };
              };
              if (found !== 0) {
                help = rtl.diffSet(fCardsInGame,rtl.createSet(found));
                if (($mod.BockCard({get: function () {
                    return fCardsInGame;
                  }, set: function (v) {
                    fCardsInGame = v;
                  }},fTrump) === found) && !($mod.BockCard({get: function () {
                    return help;
                  }, set: function (v) {
                    help = v;
                  }},fTrump) in rtl.unionSet(fProbableView.get()[fPlayer - 1],fProbableView.get()[partner - 1]))) for (i = 0; i <= 8; i++) {
                  if (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump) {
                    if ($mod.Adjacent(mylegal.get()[i],found,{get: function () {
                        return restcards;
                      }, set: function (v) {
                        restcards = v;
                      }})) {
                      if ($mod.CardValues[found] > $mod.CardValues[mylegal.get()[i]]) found = mylegal.get()[i];
                    } else if ($mod.CardBetter[mylegal.get()[i]][found]) found = mylegal.get()[i];
                  };
                };
              };
            } else {
              found = 0;
            };
          };
        };
        if ((fTrump < 5) && (found === pas.SWSBase.gCardOf[fTrump][6]) && (pas.SWSBase.ValueOfTrick(fTrump,pas.SWSBase.TTrick.$clone(NewTrick)) < 10)) {
          found = 0;
        };
        if ((fTrump < 5) && (found === 0) && ((winner !== partner) || $mod.CardBetter[stich][$mod.BockCard({get: function () {
            return restcards;
          }, set: function (v) {
            restcards = v;
          }},pas.SWSBase.gColourOf[stich])]) && (($mod.CountColorCards({a: partner - 1, p: fProbableView.get(), get: function () {
            return this.p[this.a];
          }, set: function (v) {
            this.p[this.a] = v;
          }},fTrump) === 0) || (NewTrick.fPlayed[partner] !== 0)) && ($mod.CountColorHand({get: function () {
            return myhand;
          }, set: function (v) {
            myhand = v;
          }},fTrump) > 0)) {
          tcount = $mod.CountColorCards({a: partner - 1, p: fProbableView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fTrump);
          if ((tcount > 0) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[fPlayer] - 1, p: fProbableView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fTrump) < tcount) && ($mod.CountColorCards({a: pas.SWSBase.gNextPlayer[partner] - 1, p: fProbableView.get(), get: function () {
              return this.p[this.a];
            }, set: function (v) {
              this.p[this.a] = v;
            }},fTrump) < tcount)) {
            for (color = 1; color <= 4; color++) if (color !== fTrump) tcount = tcount + $mod.BockErwartung({get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},{get: function () {
                return restcards;
              }, set: function (v) {
                restcards = v;
              }},color,false,true,{get: function () {
                return dumb;
              }, set: function (v) {
                dumb = v;
              }});
            tcount = $mod.CountColorHand({get: function () {
                return myhand;
              }, set: function (v) {
                myhand = v;
              }},fTrump) + tcount;
            if ((8 * tcount) >= (5 * (9 - rtl.trunc(fcount / 4)))) {
              for (i = 0; i <= 8; i++) {
                if (pas.SWSBase.gColourOf[mylegal.get()[i]] === fTrump) {
                  if (found === 0) {
                    found = mylegal.get()[i]}
                   else if ($mod.CardBetter[mylegal.get()[i]][found]) found = mylegal.get()[i];
                };
              };
            };
          };
        };
      };
      Result = found;
      return Result;
    };
  };
},["Dialogs","ResUtils","SWSFile","PcFiles"]);
rtl.module("program",["System","SWSBase","RalphJss"],function () {
  "use strict";
  var $mod = this;
  $mod.$main = function () {
    pas.SWSBase.InitSWSBase();
  };
});

rtl.run(); return { pas, rtl };
}
