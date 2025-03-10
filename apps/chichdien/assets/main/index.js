System.register("chunks:///_virtual/Effect.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(t){var e,n,o,i,s,c,p;return{setters:[function(t){e=t.inheritsLoose},function(t){n=t.cclegacy,o=t._decorator,i=t.UIOpacity,s=t.Input,c=t.macro,p=t.Component}],execute:function(){var f;n._RF.push({},"f4450O2raVNorwj3v7AUpWy","Effect",void 0);var a=o.ccclass;o.property,t("Effect",a("Effect")(f=function(t){function n(){for(var e,n=arguments.length,o=new Array(n),i=0;i<n;i++)o[i]=arguments[i];return(e=t.call.apply(t,[this].concat(o))||this).opacityComponent=null,e}e(n,t);var o=n.prototype;return o.start=function(){this.opacityComponent=this.node.getComponent(i),this.node.on(s.EventType.TOUCH_START,this.startEffect,this),this.node.on(s.EventType.MOUSE_DOWN,this.startEffect,this),this.node.on(s.EventType.TOUCH_END,this.stopEffect,this),this.node.on(s.EventType.MOUSE_UP,this.stopEffect,this),this.node.on(s.EventType.MOUSE_LEAVE,this.stopEffect,this)},o.stopEffect=function(){this.unschedule(this.displayEffect),this.opacityComponent.opacity=0},o.startEffect=function(){this.schedule(this.displayEffect,.05,c.REPEAT_FOREVER,0)},o.displayEffect=function(){this.opacityComponent.opacity=0===this.opacityComponent.opacity?255:0},o.update=function(t){},n}(p))||f);n._RF.pop()}}}));

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