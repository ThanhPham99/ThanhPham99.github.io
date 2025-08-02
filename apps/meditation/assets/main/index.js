System.register("chunks:///_virtual/Bonk.ts",["./rollupPluginModLoBabelHelpers.js","cc","./Score.ts"],(function(t){var e,n,r,o,i,c,a,s,l,u,p;return{setters:[function(t){e=t.applyDecoratedDescriptor,n=t.inheritsLoose,r=t.initializerDefineProperty,o=t.assertThisInitialized},function(t){i=t.cclegacy,c=t._decorator,a=t.Prefab,s=t.instantiate,l=t.Animation,u=t.Component},function(t){p=t.Score}],execute:function(){var f,d,h,y,v;i._RF.push({},"bf50aVqj1dFfKTbpLN1k2nj","Bonk",void 0);var b=c.ccclass,k=c.property;t("Bonk",(f=b("Bonk"),d=k(a),f((v=e((y=function(t){function e(){for(var e,n=arguments.length,i=new Array(n),c=0;c<n;c++)i[c]=arguments[c];return e=t.call.apply(t,[this].concat(i))||this,r(e,"flyText",v,o(e)),e.score=0,e}n(e,t);var i=e.prototype;return i.start=function(){},i.click=function(){var t=this;this.score++,p._instance.updateScore(this.score);var e=s(this.flyText);this.node.addChild(e);var n=e.getComponent(l);n.play(),n.on(l.EventType.FINISHED,(function(){t.node.removeChild(e)}))},i.update=function(t){},e}(u)).prototype,"flyText",[d],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),h=y))||h));i._RF.pop()}}}));

System.register("chunks:///_virtual/Boot.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(r){var t,e,o,n,i,a,c,s,l;return{setters:[function(r){t=r.applyDecoratedDescriptor,e=r.inheritsLoose,o=r.initializerDefineProperty,n=r.assertThisInitialized},function(r){i=r.cclegacy,a=r._decorator,c=r.ProgressBar,s=r.director,l=r.Component}],execute:function(){var p,u,f,d,g;i._RF.push({},"8d889mt6GVJHLL/mqkaClta","Boot",void 0);var y=a.ccclass,B=a.property;r("Boot",(p=y("Boot"),u=B(c),p((g=t((d=function(r){function t(){for(var t,e=arguments.length,i=new Array(e),a=0;a<e;a++)i[a]=arguments[a];return t=r.call.apply(r,[this].concat(i))||this,o(t,"progressBar",g,n(t)),t}e(t,r);var i=t.prototype;return i.onLoad=function(){var r=this;s.preloadScene("main",(function(t,e,o){r.progressBar.progress=t/e}),(function(){s.loadScene("main")}))},i.start=function(){},i.update=function(r){},t}(l)).prototype,"progressBar",[u],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),f=d))||f));i._RF.pop()}}}));

System.register("chunks:///_virtual/main",["./Bonk.ts","./Boot.ts","./Score.ts"],(function(){return{setters:[null,null,null],execute:function(){}}}));

System.register("chunks:///_virtual/Score.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(t){var n,o,e,r,c;return{setters:[function(t){n=t.inheritsLoose},function(t){o=t.cclegacy,e=t._decorator,r=t.Label,c=t.Component}],execute:function(){var i,s;o._RF.push({},"5fa38hwsOZKR7KRpHhll3CE","Score",void 0);var u=e.ccclass;e.property,t("Score",u("Score")(((s=function(t){function o(){return t.apply(this,arguments)||this}n(o,t);var e=o.prototype;return e.onLoad=function(){o._instance=this},e.start=function(){},e.updateScore=function(t){this.getComponent(r).string=t.toString()},e.update=function(t){},o}(c))._instance=null,i=s))||i);o._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});