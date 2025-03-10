System.register("chunks:///_virtual/Effect.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(t){var e,i,n,o,c,s,r,p,a,f,u;return{setters:[function(t){e=t.applyDecoratedDescriptor,i=t.inheritsLoose,n=t.initializerDefineProperty,o=t.assertThisInitialized},function(t){c=t.cclegacy,s=t._decorator,r=t.AudioSource,p=t.UIOpacity,a=t.Input,f=t.macro,u=t.Component}],execute:function(){var h,l,y,E,d;c._RF.push({},"f4450O2raVNorwj3v7AUpWy","Effect",void 0);var v=s.ccclass,S=s.property;t("Effect",(h=v("Effect"),l=S({type:r}),h((d=e((E=function(t){function e(){for(var e,i=arguments.length,c=new Array(i),s=0;s<i;s++)c[s]=arguments[s];return e=t.call.apply(t,[this].concat(c))||this,n(e,"electricSound",d,o(e)),e.opacityComponent=null,e}i(e,t);var c=e.prototype;return c.start=function(){this.opacityComponent=this.node.getComponent(p),this.node.on(a.EventType.TOUCH_START,this.startEffect,this),this.node.on(a.EventType.MOUSE_DOWN,this.startEffect,this),this.node.on(a.EventType.TOUCH_END,this.stopEffect,this),this.node.on(a.EventType.MOUSE_UP,this.stopEffect,this),this.node.on(a.EventType.MOUSE_LEAVE,this.stopEffect,this)},c.stopEffect=function(){this.unschedule(this.displayEffect),this.opacityComponent.opacity=0,this.electricSound.stop()},c.startEffect=function(){this.electricSound.playing||this.electricSound.play(),this.schedule(this.displayEffect,.05,f.REPEAT_FOREVER,0)},c.displayEffect=function(){this.opacityComponent.opacity=0===this.opacityComponent.opacity?255:0},c.update=function(t){},e}(u)).prototype,"electricSound",[l],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),y=E))||y));c._RF.pop()}}}));

System.register("chunks:///_virtual/main",["./Effect.ts"],(function(){return{setters:[null],execute:function(){}}}));

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