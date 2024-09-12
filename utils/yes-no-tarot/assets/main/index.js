System.register("chunks:///_virtual/BootController.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(r){var o,e,t,n,i,a,s,c,l,u;return{setters:[function(r){o=r.applyDecoratedDescriptor,e=r.inheritsLoose,t=r.initializerDefineProperty,n=r.assertThisInitialized},function(r){i=r.cclegacy,a=r._decorator,s=r.ProgressBar,c=r.director,l=r.resources,u=r.Component}],execute:function(){var p,f,d,g,B;i._RF.push({},"c4054PTn6BK+7hEMe02Wfo+","BootController",void 0);var h=a.ccclass,y=a.property;r("BootController",(p=h("BootController"),f=y(s),p((B=o((g=function(r){function o(){for(var o,e=arguments.length,i=new Array(e),a=0;a<e;a++)i[a]=arguments[a];return o=r.call.apply(r,[this].concat(i))||this,t(o,"progressBar",B,n(o)),o}e(o,r);var i=o.prototype;return i.onLoad=function(){var r=this;c.preloadScene("main",(function(o,e,t){r.progressBar.progress=o/e/2}),(function(){l.loadDir("cards",(function(o,e,t){r.progressBar.progress=.5+o/e/2}),(function(){c.loadScene("main")}))}))},i.start=function(){},i.update=function(r){},o}(u)).prototype,"progressBar",[f],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),d=g))||d));i._RF.pop()}}}));

System.register("chunks:///_virtual/debug-view-runtime-control.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(t){var e,o,i,n,s,l,r,a,g,h,p,c,C,d,m,u,L;return{setters:[function(t){e=t.applyDecoratedDescriptor,o=t.inheritsLoose,i=t.initializerDefineProperty,n=t.assertThisInitialized},function(t){s=t.cclegacy,l=t._decorator,r=t.Node,a=t.Color,g=t.Canvas,h=t.UITransform,p=t.instantiate,c=t.Label,C=t.RichText,d=t.Toggle,m=t.Button,u=t.director,L=t.Component}],execute:function(){var f,M,b,v,T,S,x,E,I;s._RF.push({},"b2bd1+njXxJxaFY3ymm06WU","debug-view-runtime-control",void 0);var A=l.ccclass,y=l.property;t("DebugViewRuntimeControl",(f=A("internal.DebugViewRuntimeControl"),M=y(r),b=y(r),v=y(r),f((x=e((S=function(t){function e(){for(var e,o=arguments.length,s=new Array(o),l=0;l<o;l++)s[l]=arguments[l];return e=t.call.apply(t,[this].concat(s))||this,i(e,"compositeModeToggle",x,n(e)),i(e,"singleModeToggle",E,n(e)),i(e,"EnableAllCompositeModeButton",I,n(e)),e._single=0,e.strSingle=["No Single Debug","Vertex Color","Vertex Normal","Vertex Tangent","World Position","Vertex Mirror","Face Side","UV0","UV1","UV Lightmap","Project Depth","Linear Depth","Fragment Normal","Fragment Tangent","Fragment Binormal","Base Color","Diffuse Color","Specular Color","Transparency","Metallic","Roughness","Specular Intensity","IOR","Direct Diffuse","Direct Specular","Direct All","Env Diffuse","Env Specular","Env All","Emissive","Light Map","Shadow","AO","Fresnel","Direct Transmit Diffuse","Direct Transmit Specular","Env Transmit Diffuse","Env Transmit Specular","Transmit All","Direct Internal Specular","Env Internal Specular","Internal All","Fog"],e.strComposite=["Direct Diffuse","Direct Specular","Env Diffuse","Env Specular","Emissive","Light Map","Shadow","AO","Normal Map","Fog","Tone Mapping","Gamma Correction","Fresnel","Transmit Diffuse","Transmit Specular","Internal Specular","TT"],e.strMisc=["CSM Layer Coloration","Lighting With Albedo"],e.compositeModeToggleList=[],e.singleModeToggleList=[],e.miscModeToggleList=[],e.textComponentList=[],e.labelComponentList=[],e.textContentList=[],e.hideButtonLabel=void 0,e._currentColorIndex=0,e.strColor=["<color=#ffffff>","<color=#000000>","<color=#ff0000>","<color=#00ff00>","<color=#0000ff>"],e.color=[a.WHITE,a.BLACK,a.RED,a.GREEN,a.BLUE],e}o(e,t);var s=e.prototype;return s.start=function(){if(this.node.parent.getComponent(g)){var t=this.node.parent.getComponent(h),e=.5*t.width,o=.5*t.height,i=.1*e-e,n=o-.1*o,s=this.node.getChildByName("MiscMode"),l=p(s);l.parent=this.node,l.name="Buttons";var r=p(s);r.parent=this.node,r.name="Titles";for(var u=0;u<2;u++){var L=p(this.EnableAllCompositeModeButton.getChildByName("Label"));L.setPosition(i+(u>0?450:150),n,0),L.setScale(.75,.75,.75),L.parent=r;var f=L.getComponent(c);f.string=u?"----------Composite Mode----------":"----------Single Mode----------",f.color=a.WHITE,f.overflow=0,this.labelComponentList[this.labelComponentList.length]=f}n-=20;for(var M=0,b=0;b<this.strSingle.length;b++,M++){b===this.strSingle.length>>1&&(i+=200,M=0);var v=b?p(this.singleModeToggle):this.singleModeToggle;v.setPosition(i,n-20*M,0),v.setScale(.5,.5,.5),v.parent=this.singleModeToggle.parent;var T=v.getComponentInChildren(C);T.string=this.strSingle[b],this.textComponentList[this.textComponentList.length]=T,this.textContentList[this.textContentList.length]=T.string,v.on(d.EventType.TOGGLE,this.toggleSingleMode,this),this.singleModeToggleList[b]=v}i+=200,this.EnableAllCompositeModeButton.setPosition(i+15,n,0),this.EnableAllCompositeModeButton.setScale(.5,.5,.5),this.EnableAllCompositeModeButton.on(m.EventType.CLICK,this.enableAllCompositeMode,this),this.EnableAllCompositeModeButton.parent=l;var S=this.EnableAllCompositeModeButton.getComponentInChildren(c);this.labelComponentList[this.labelComponentList.length]=S;var x=p(this.EnableAllCompositeModeButton);x.setPosition(i+90,n,0),x.setScale(.5,.5,.5),x.on(m.EventType.CLICK,this.changeTextColor,this),x.parent=l,(S=x.getComponentInChildren(c)).string="TextColor",this.labelComponentList[this.labelComponentList.length]=S;var E=p(this.EnableAllCompositeModeButton);E.setPosition(i+200,n,0),E.setScale(.5,.5,.5),E.on(m.EventType.CLICK,this.hideUI,this),E.parent=this.node.parent,(S=E.getComponentInChildren(c)).string="Hide UI",this.labelComponentList[this.labelComponentList.length]=S,this.hideButtonLabel=S,n-=40;for(var I=0;I<this.strMisc.length;I++){var A=p(this.compositeModeToggle);A.setPosition(i,n-20*I,0),A.setScale(.5,.5,.5),A.parent=s;var y=A.getComponentInChildren(C);y.string=this.strMisc[I],this.textComponentList[this.textComponentList.length]=y,this.textContentList[this.textContentList.length]=y.string,A.getComponent(d).isChecked=!!I,A.on(d.EventType.TOGGLE,I?this.toggleLightingWithAlbedo:this.toggleCSMColoration,this),this.miscModeToggleList[I]=A}n-=150;for(var D=0;D<this.strComposite.length;D++){var B=D?p(this.compositeModeToggle):this.compositeModeToggle;B.setPosition(i,n-20*D,0),B.setScale(.5,.5,.5),B.parent=this.compositeModeToggle.parent;var w=B.getComponentInChildren(C);w.string=this.strComposite[D],this.textComponentList[this.textComponentList.length]=w,this.textContentList[this.textContentList.length]=w.string,B.on(d.EventType.TOGGLE,this.toggleCompositeMode,this),this.compositeModeToggleList[D]=B}}else console.error("debug-view-runtime-control should be child of Canvas")},s.isTextMatched=function(t,e){var o=new String(t),i=o.search(">");return-1===i?t===e:(o=(o=o.substr(i+1)).substr(0,o.search("<")))===e},s.toggleSingleMode=function(t){for(var e=u.root.debugView,o=t.getComponentInChildren(C),i=0;i<this.strSingle.length;i++)this.isTextMatched(o.string,this.strSingle[i])&&(e.singleMode=i)},s.toggleCompositeMode=function(t){for(var e=u.root.debugView,o=t.getComponentInChildren(C),i=0;i<this.strComposite.length;i++)this.isTextMatched(o.string,this.strComposite[i])&&e.enableCompositeMode(i,t.isChecked)},s.toggleLightingWithAlbedo=function(t){u.root.debugView.lightingWithAlbedo=t.isChecked},s.toggleCSMColoration=function(t){u.root.debugView.csmLayerColoration=t.isChecked},s.enableAllCompositeMode=function(t){var e=u.root.debugView;e.enableAllCompositeMode(!0);for(var o=0;o<this.compositeModeToggleList.length;o++){this.compositeModeToggleList[o].getComponent(d).isChecked=!0}var i=this.miscModeToggleList[0].getComponent(d);i.isChecked=!1,e.csmLayerColoration=!1,(i=this.miscModeToggleList[1].getComponent(d)).isChecked=!0,e.lightingWithAlbedo=!0},s.hideUI=function(t){var e=this.node.getChildByName("Titles"),o=!e.active;this.singleModeToggleList[0].parent.active=o,this.miscModeToggleList[0].parent.active=o,this.compositeModeToggleList[0].parent.active=o,this.EnableAllCompositeModeButton.parent.active=o,e.active=o,this.hideButtonLabel.string=o?"Hide UI":"Show UI"},s.changeTextColor=function(t){this._currentColorIndex++,this._currentColorIndex>=this.strColor.length&&(this._currentColorIndex=0);for(var e=0;e<this.textComponentList.length;e++)this.textComponentList[e].string=this.strColor[this._currentColorIndex]+this.textContentList[e]+"</color>";for(var o=0;o<this.labelComponentList.length;o++)this.labelComponentList[o].color=this.color[this._currentColorIndex]},s.onLoad=function(){},s.update=function(t){},e}(L)).prototype,"compositeModeToggle",[M],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),E=e(S.prototype,"singleModeToggle",[b],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),I=e(S.prototype,"EnableAllCompositeModeButton",[v],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),T=S))||T));s._RF.pop()}}}));

System.register("chunks:///_virtual/GameController.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(n){var h,t,i,c,g,a,e,m,o,r,u,l,s,b,v,y,d;return{setters:[function(n){h=n.applyDecoratedDescriptor,t=n.inheritsLoose,i=n.initializerDefineProperty,c=n.assertThisInitialized},function(n){g=n.cclegacy,a=n._decorator,e=n.Node,m=n.Label,o=n.Button,r=n.tween,u=n.UIOpacity,l=n.instantiate,s=n.Vec3,b=n.resources,v=n.SpriteFrame,y=n.Sprite,d=n.Component}],execute:function(){var p,k,q,C,B,T,N,S,_;g._RF.push({},"1cd1dyL89FNvIsS4NM2OTjk","GameController",void 0);var H=a.ccclass,x=a.property;n("GameController",(p=H("GameController"),k=x(e),q=x(e),C=x(e),p((N=h((T=function(n){function h(){for(var h,t=arguments.length,g=new Array(t),a=0;a<t;a++)g[a]=arguments[a];return h=n.call.apply(n,[this].concat(g))||this,i(h,"inputBlock",N,c(h)),i(h,"selectCardStage",S,c(h)),i(h,"resultStage",_,c(h)),h.cardContainer=void 0,h.selectCardGuide=void 0,h.resultCard=void 0,h.resultCardName=void 0,h.resultCardYes=void 0,h.resultCardNo=void 0,h.resultDesc=void 0,h.cards=[{card_name:"Death",value:"No",description:"Đã đến lúc bạn phải thanh lọc nội tâm và chuyển hóa cá nhân. Lá bài Death lúc này biểu thị rằng bạn phải đón nhận sự thay đổi. Bạn có nhận ra rằng mình có một nguồn sức mạnh và quyền lực chưa được khai thác hoàn toàn không? Bây giờ là lúc để vượt qua nỗi sợ hãi, phá vỡ những hạn chế và thách thức những giới hạn của mình. Bạn là một chiến binh bẩm sinh. Vì vậy, hãy nỗ lực hơn một chút và và khám phá tinh thần chiến đấu của bạn. Có thể có một mối quan hệ độc hại hoặc một công việc mà bạn muốn từ bỏ nhưng lại sợ phải làm. \"Chết\" là về sự đổi mới, sự tái sinh và sự tái tạo. Vì vậy, hãy vượt qua nỗi sợ hãi của bạn và chấp nhận rằng 'Thay đổi' là khuôn mẫu của cuộc sống."},{card_name:"Justice",value:"No",description:"Hãy ngừng đổ lỗi cho người khác về lỗi lầm của bạn. Lá bài này gợi ý rằng bạn phải đủ dũng cảm để chịu trách nhiệm về hành động của chính mình. Bạn có thể đã làm điều gì đó không đạo đức hoặc không đúng. Bạn có thể mắc sai lầm nhưng hãy quay lại và sửa chữa lỗi lầm của mình (nếu điều đó phù hợp với bạn vào lúc này). Việc thẻ này xuất hiện là một dấu hiệu rõ ràng cho thấy bạn phải chú ý đến những việc làm của mình và suy nghĩ hai lần trước khi hành động. Vì vậy, để thiết lập sự hòa hợp trong các mối quan hệ của bạn, hãy chấp nhận những gì bạn đã làm và sớm khắc phục lỗi sai."},{card_name:"Strength",value:"No",description:"Đã đến lúc bổ sung năng lượng của bạn. Bạn có thể đang cảm thấy mệt mỏi hoặc hoàn toàn cạn kiệt năng lượng. Nhưng đừng đánh giá thấp năng lực sáng tạo của bạn. Lá bài Sức mạnh này gắn liền với cung Sư Tử và nguyên tố lửa. Vì vậy, bạn có trong mình, nhưng bạn có thể đang cảm thấy bị quật ngã bởi những thách thức tạm thời. Những thử thách này đến để 'tiếp thêm sức mạnh' cho bạn; vì vậy hãy dành thời gian để hiểu rõ bản thân mình. Bạn càng rút lui và cô lập bản thân thì bạn càng thấy khó thể hiện bản thân. Bạn hoàn toàn có thể cảm thấy hơi chán nản nhưng đừng làm đứt gãy ý tưởng và sự hứng khởi của mình. Ngủ một chút (nếu cần), gọi điện cho bạn bè để nói chuyện hoặc đi dạo (xem điều gì phù hợp nhất với bạn vào lúc này). Hãy đẩy lùi sự lười biếng và cảm nhận sự khác biệt!"},{card_name:"Temperance",value:"No",description:"Lá Temperance gợi ý rằng bạn cần giữ sự cân bằng trong mọi việc bạn đang làm. Nếu bạn đã làm việc và tiệc tùng quá mức, hãy suy nghĩ kỹ về cách sống của mình. Tâm trí và cơ thể của bạn có thể cần một chút nghỉ ngơi và trẻ hóa. Hãy vượt qua những cảm giác ăn quá nhiều và uống quá nhiều. Đây là thời điểm tốt nhất để ôm lấy những lý tưởng tâm linh và nhận ra tiềm năng của bạn. Chúng ta tất cả đều có một phần bản năng hoang dã và thách thức là chế ngự nó. Hãy thực hành lòng kiên nhẫn và điều chỉnh năng lượng của bạn nếu bạn muốn thấy mục tiêu của mình thành hiện thực."},{card_name:"The Chariot",value:"No",description:"Đảm bảo quản lý cuộc sống cảm xúc của bạn và sử dụng bản năng để giải quyết vấn đề của bạn. Bạn là người nhạy cảm nhưng đừng để nó tràn ngập hoặc kiểm soát bạn. Bạn có thể đang trải qua một biến động cảm xúc, vì vậy bây giờ là lúc để đánh giá lại tình hình của bạn và kiểm soát cảm xúc của mình. Hãy bình tĩnh và duy trì khả năng tự chủ tốt nếu bạn không muốn tình hình vượt quá tầm kiểm soát của mình. Do hoàn cảnh xung quanh, bạn có thể cảm thấy mệt mỏi và kiệt sức. Hãy dừng lại một chút, nghỉ ngơi và lấy lại tư thế sẵn sàng đón nhận thử thách."},{card_name:"The Devil",value:"No",description:"Ở đây chúng ta có Con Dê có sừng, đại diện cho sự gắn kết và lạm dụng quyền lực.  Vì vậy, bây giờ là lúc để bạn từ bỏ ham muốn của mình (không phải mục tiêu - có sự khác biệt giữa hai điều này) và tính ích kỷ. Hiện tại bạn có thể đang phải trải qua nỗi đau và sự đấu tranh, nhưng đừng quên rằng nếu bạn từ bỏ những cám dỗ thì sự biến đổi sẽ không còn xa nữa. Đừng để những cảm xúc tiêu cực bẫy bạn. Bạn có rất nhiều năng lượng sáng tạo nhưng việc sử dụng nó như thế nào hoàn toàn là sự lựa chọn của bạn. Hãy dũng cảm đủ để khám phá những suy nghĩ tăm tối của mình và từ bỏ chúng như những lá cây khô. Bạn sẽ trở nên trẻ lại nếu bạn xác định rõ ranh giới của mình và nỗ lực để phá vỡ chúng."},{card_name:"The Emperor",value:"No",description:"Bạn là một người lãnh đạo nhưng có thể đang tránh xa khỏi nó hoặc thực hiện quá nhiều kiểm soát. Lá bài này hiện tại gợi ý rằng bạn cần duy trì một sự cân bằng tốt giữa mục tiêu của bạn và cách bạn triển khai ý tưởng của mình.  The Emperor biểu thị quyền lực có thể vừa mang tính xây dựng vừa mang tính hủy diệt. Vì vậy, bạn phải thực hiện một sự lựa chọn thông minh ở đây. Trong công việc và mối quan hệ của bạn, bạn đang tìm kiếm sự luồng năng lượng tự do. Ở điểm này, bạn có thể có quá nhiều năng lượng tự nhiên chảy qua dây thần kinh của mình. Vì vậy, hãy bình tĩnh lại, linh hoạt và suy nghĩ kỹ lưỡng trước khi hành động."},{card_name:"The Empress",value:"Yes",description:"Bạn đang ở thời kỳ mà khả năng sáng tạo và trí tưởng tượng đang tăng cao. Vì vậy, đây là thời điểm thích hợp để xem xét các dự án, mục tiêu, mối quan hệ, thói quen và hoạt động giải trí của bạn từ mọi góc độ. Xem tài sản cá nhân của bạn từ mọi khía cạnh sẽ cho phép bạn thực hiện những thay đổi cần thiết. Vì vậy, hãy thực hiện những thay đổi đó và làm đẹp các mối quan hệ của bạn để tận hưởng một cuộc sống trọn vẹn hơn. Lá bài Empress gợi ý rằng bạn cần được chăm sóc tốt. Vì vậy, hãy cho năng lượng sáng tạo của bạn một cơ hội công bằng để thể hiện vì chúng sẽ mang lại cho bạn nhiều thành quả nhất trong giai đoạn này."},{card_name:"The Fool",value:"No",description:"Bạn là một linh hồn tự do và sự tự phát là sức mạnh của bạn. Bạn là người thích mạo hiểm nhưng bạn có liều lĩnh không? Bạn muốn bắt đầu một chuyến thám hiểm nhưng đã có kế hoạch phù hợp chưa? Phiêu lưu mạo hiểm là điều tuyệt vời nhưng đừng bỏ qua những thách thức đang chờ đợi bạn. Đây không phải là thời điểm để ngây thơ. Bạn quá háo hức để bắt đầu một dự án mới hoặc bắt đầu một mối quan hệ mới nhưng có thể quá lo lắng để thực hiện hành động cần thiết. Hãy hành động nhưng bạn phải tránh gặp phải quá nhiều rủi ro cùng một lúc. Hãy giữ tinh thần tự do của bạn tồn tại nhưng trong quá trình đó đừng làm hại bản thân hoặc người khác."},{card_name:"The Hanged Man",value:"No",description:"Hãy ngừng chống lại năng lượng tự nhiên của bạn. Đây là lúc để bạn nhạy bén hơn một chút với những gì hệ thống nội tâm của bạn đang nói. Bạn có thể kiệt sức khi đang thực hiện một dự án, vì vậy đừng ngại nhấn nút tạm dừng. Và nếu bạn cho rằng nhấn nút tạm dừng đó sẽ lãng phí thời gian thì hãy đánh giá lại suy nghĩ của bạn. Việc tiêu tốn hoặc tiết kiệm năng lượng của bạn phụ thuộc vào cách bạn sử dụng thời gian của mình. Vì vậy, hãy dừng lại cho đến khi bạn cảm thấy đủ sức để tiếp tục công việc hàng ngày của mình. Trong thời gian bạn nghỉ ngơi bạn có thể thực hiện thiền định, suy ngẫm, vẽ, khiêu vũ, hướng nội và kết nối với các sức mạnh thiên đường. Một khi bạn cảm thấy đủ năng lượng; sau đó bắt tay vào thực hiện để mang lại kết quả tốt nhất. Sự xuất hiện của lá bài này đang thúc giục bạn hiểu giá trị của 'nghỉ ngơi để cân bằng'."},{card_name:"The Hermit",value:"No",description:"Hiện tại bạn đang trong quá trình khám phá bản thân. Bạn có thể đã dành quá nhiều thời gian cho việc phân tích bản thân, điều này có thể dẫn đến cảm giác cô đơn và cô lập. Dù việc dành rất nhiều thời gian cho việc nâng cao tinh thần là tốt, nhưng đừng quên rằng những người thân yêu của bạn cũng cần thời gian và sự quan tâm của bạn. Bạn là người độc đáo, nhưng để tránh sự dao động, đừng quá mải mê vào việc suy nghĩ về tương lai. Đây là thời điểm để làm cho cảm xúc của bạn được hòa hợp, thiền định và áp dụng trí óc nhạy bén của mình. Nhưng trên hết hãy kiên nhẫn và trân trọng những gì bạn có."},{card_name:"The Hierophant",value:"No",description:"Hãy dừng lại việc đi theo người khác mù quáng và tin vào trực giác của bạn. Hierophant còn được biết đến như Giáo Hoàng hoặc Giáo Sư. Bạn chính là người thầy của chính mình, vì vậy hãy tìm kiếm sự khôn ngoan bên trong.  Thay vì làm theo người khác, hãy cố gắng xây dựng hệ thống niềm tin của riêng bạn. Cho đến nay, bạn đã nhìn nhận thế giới qua một lăng kính duy nhất, nhưng bây giờ là thời điểm để nhìn nhận nó từ nhiều góc độ khác nhau. The Hierophant gắn liền với cung Kim Ngưu, biểu thị thế giới cảm xúc của bạn. Nếu bạn có điều gì muốn chia sẻ, hãy gọi điện cho bạn bè hoặc nói chuyện với những người thân thiết của bạn. Đừng kìm nén cảm xúc của bạn. Việc trút bỏ chúng sẽ xóa sạch ảo tưởng của bạn, giúp bạn chuyển hóa và đối mặt với thực tế."},{card_name:"The High Priestess",value:"Yes",description:"Lá bài High Priestess trong cách giải thích đơn giản và tích cực nhất cho thấy sức mạnh của trực giác của bạn đang phát triển. Bạn có thể muốn đi sâu vào mọi vấn đề và bây giờ bạn dường như biết rằng có rất nhiều điều hơn những gì bạn thấy. Trong thời kỳ này, những bí ẩn sẽ mở ra và những điều ẩn giấu sẽ lộ diện. Đây cũng có thể là thời điểm bạn phải đưa ra một số quyết định khó khăn. Nhưng nếu bạn giữ im lặng và kết nối với bản thân cao cả của mình, mọi thứ sẽ trở nên dễ dàng hơn cho bạn."},{card_name:"Judgement",value:"Yes",description:"Đã đến lúc thay đổi những thói quen cũ mà bạn đã cố gắng từ bỏ từ lâu. Đây dường như cũng là thời điểm thích hợp để đưa ra một số quyết định quan trọng và mang lại những thay đổi đáng kể. Lá bài này đang thúc đẩy bạn hướng tới sự thức tỉnh tâm linh, vì vậy đừng cảm thấy bị mắc kẹt nếu bạn phải đưa ra một quyết định quan trọng. Hãy tin vào trực giác và trí tuệ của bạn. Bạn có thể thấy mình đang ở ngã ba đường nhưng đừng lo lắng- Sức Mạnh Cao Thượng đang dẫn dắt bạn một cách bí mật!  Vì vậy, hãy tự do sử dụng sự thông thái và tính liêm chính của bạn và từ bỏ những kinh nghiệm quá khứ để khám phá ' tiếng gọi bên trong' của bạn."},{card_name:"The Lovers",value:"Yes",description:"Bề mặt của lá bài Lovers cho thấy bạn có mối quan hệ hòa hợp với những người thân yêu của mình. Sự giao tiếp cởi mở và sự đánh giá cao của bạn dành cho những người bạn yêu thương càng làm đẹp hơn các mối quan hệ của bạn. Lá bài này nhấn mạnh đến sự đoàn kết và đồng cảm không chỉ với con người mà cả sự sống dưới mọi hình thức (cây cỏ và động vật). Bạn tôn vinh Linh hồn ở mọi khía cạnh và coi cuộc sống là sự hiện thân của Thượng đế. Bạn muốn thiết lập các mối quan hệ hòa bình và thống nhất các mặt đối lập. Bạn có thể có những quan điểm khác nhau trong các mối quan hệ của mình và lá bài này gợi ý rằng những nỗ lực của bạn (trong giai đoạn này) sẽ đơm hoa kết trái nếu bạn cố gắng hóa giải sự phân cực giữa những người thân yêu của mình."},{card_name:"The Magician",value:"Yes",description:"Đã đến lúc thể hiện ý định của bạn và biến chúng thành hành động. Lá bài này tượng trưng cho sự gặp gỡ giữa thế giới vật chất và tâm linh. Vì vậy, nếu bạn đang nghĩ đến việc biến ý tưởng của mình thành hành động thì bây giờ là thời điểm thích hợp. The Magician được liên kết với hành tinh Sao Thủy. Sao Thủy là sứ giả có cánh và du hành giữa các vị thần và nhân loại. Vì vậy, nếu bạn có một thông điệp muốn truyền đi, hãy chắc chắn rằng trời đang lắng nghe và bạn sẽ được đáp ứng!  Lá bài này nói về sự biểu hiện, sự tái sinh về mặt tâm linh và khai thác tiềm năng vô hạn của bạn. Vì vậy, hãy thu thập ý tưởng của bạn và xem chúng trở thành hiện thực."},{card_name:"The Moon",value:"No",description:"Thoát khỏi sự bối rối và mơ hồ về tinh thần của bạn. Hiện tại, bạn có thể đang phải đối mặt với nhiều hỗn loạn, nhưng đừng áp dụng các biện pháp không công bằng để giải quyết vấn đề.  Đây cũng là lúc bạn có thể bị thu hút đặc biệt bởi ma túy, chất độc và rượu bia. Mặc dù lá bài Mặt Trăng có thể mang lại những biểu hiện tiêu cực cho bạn, nhưng đừng quên rằng trực giác của bạn mạnh mẽ hơn nỗi sợ hãi rất nhiều. Nếu bạn trau dồi tự kiểm soát bản thân, thì đây có thể thực sự là một giai đoạn giải thoát cho bạn. Bạn cũng có thể nhạy cảm hơn bình thường và có những trải nghiệm tâm linh. Vì vậy, hãy lắng nghe tiếng nói bên trong của bạn và hiểu rằng Sức Mạnh Cao Thượng đang có một thông điệp dành cho bạn."},{card_name:"The Star",value:"Yes",description:"Bạn đang bắt đầu nhận ra bản chất cốt lõi của mình. Lá bài Star đánh dấu một giai đoạn tươi đẹp khi tất cả những cuộc đối đầu của bạn đều đang dần kết thúc. Tâm trí của bạn đã trở nên màu mỡ hơn và bạn đã sẵn sàng kết nối với Thượng đế. Sự xuất hiện của lá bài Star đánh dấu một tia hy vọng và thúc giục bạn áp dụng năng lượng sáng tạo của mình một cách đáng yêu và tích cực hơn. Đó là trạng thái tâm trí của bạn lúc này và bạn có khả năng biến ước mơ của mình thành hiện thực. Bạn cũng có thể khám phá lại một mục đích tiềm ẩn không chỉ khiến cuộc sống của bạn tràn ngập sự hài lòng mà còn truyền cảm hứng cho bạn để khiến người khác cũng hạnh phúc và hài lòng như vậy."},{card_name:"The Sun",value:"Yes",description:"Dù là một mối quan hệ hay một dự án, lá bài này hàm ý rằng bạn sẽ nhận được những kết quả tích cực trong mọi nỗ lực của mình. Đây là một thời điểm thuận lợi đối với bạn. Và ngay cả khi bạn gặp khó khăn, bạn vẫn có niềm tin rằng mọi thứ sẽ ổn và sớm mọi thứ sẽ ổn thỏa. Lúc này bạn đang mang một sức mạnh, sự quyến rũ và ánh sáng khác biệt. Vì vậy, bạn sẽ dễ dàng gây ảnh hưởng đến mọi người hơn (tất nhiên là theo hướng tích cực) và thực hiện mục tiêu của mình theo đúng hướng. Lá bài Mặt Trời đang thúc đẩy bạn tận dụng cơ sở quyền lực của mình và sớm mọi người sẽ thấy bạn vươn lên."},{card_name:"The Tower",value:"No",description:"Theo cách hiểu đơn giản nhất, lá bài này gợi ý rằng bạn phải kiểm soát tính khí nóng nảy và kiêu ngạo của mình, đặc biệt là trong giai đoạn này. Bạn đang có một lượng năng lượng sao Hỏa nhiều, đó là lý do tại sao bạn dũng cảm và táo bạo. Nhưng hãy cẩn thận để không áp đặt lên người khác nếu bạn muốn tránh bất kỳ sự cố nghiêm trọng nào.  Bạn sẽ đặt câu hỏi về hệ thống niềm tin, giá trị của mình và cách bạn đối xử với cuộc sống của mình suốt thời gian qua. Hãy thận trọng vì đây là thời điểm có nhiều biến động về mặt cảm xúc. Trong giai đoạn hỗn loạn như vậy, hãy xử lý suy nghĩ của bạn, chào đón sự thay đổi và truyền năng lượng của bạn để biến đổi bản thân hoàn toàn."},{card_name:"Wheel of Fortune",value:"No",description:"Hãy kiểm soát sự lạc quan của bạn. Nếu có điều gì đó không ổn trong cuộc sống của bạn, hãy giải quyết nó và tìm ra cách khắc phục tình trạng đang chệch hướng. Đừng quá lạc quan vì điều này sẽ khiến bạn mất tập trung vào những điều cần chú ý. Bánh Xe May Mắn ở mặt tiêu cực mô tả về may mắn không tốt, vì vậy hãy kiểm soát sự phung phí của bạn.  Đây không phải là lúc để bạn chi tiêu cho những ham muốn và sự xa hoa của mình. Đây có thể là một giai đoạn khó khăn đối với bạn, nhưng đây là thời gian để học hỏi. Tất cả những gì bạn phải làm là - thay đổi quan điểm của mình và bạn sẽ học được một số bài học sâu sắc về cuộc sống."},{card_name:"The World",value:"Yes",description:"Bạn đã sẵn sàng buông bỏ quá khứ và đón nhận những trải nghiệm mới mà cuộc sống sắp mang lại. Thẻ này gợi ý rằng bạn đã vứt bỏ những gánh nặng của mình và tự do đi du lịch mà không cảm thấy tội lỗi và hận thù nào. Đây cũng là một gợi ý rằng bạn muốn đi du lịch và nhìn ngắm thế giới, con người, nền văn hóa, ẩm thực và tôn giáo một cách tổng thể. Thực sự là một bước nhảy tinh thần tuyệt vời cho ai đó bây giờ đã sẵn lòng kết nối với toàn bộ thế giới như một thể thống nhất hoặc một gia đình!  Bạn sẽ được đưa vào những khởi đầu mới và sẽ mang lại sự hòa hợp mọi nơi bạn đi."}],h}t(h,n);var g=h.prototype;return g.onLoad=function(){this.cardContainer=this.selectCardStage.getChildByName("Card Container"),this.selectCardGuide=this.selectCardStage.getChildByName("Guide"),this.resultCard=this.resultStage.getChildByPath("Content/Card"),this.resultCardName=this.resultStage.getChildByPath("Title Layout/Card Name").getComponent(m),this.resultCardYes=this.resultStage.getChildByPath("Title Layout/Result Yes"),this.resultCardNo=this.resultStage.getChildByPath("Title Layout/Result No"),this.resultDesc=this.resultStage.getChildByPath("Content/Description").getComponent(m)},g.start=function(){},g.resetStage=function(n){var h=this,t=n.target;t.getComponent(o).interactable=!1,r(this.resultStage.getComponent(u)).to(1,{opacity:0},{easing:"smooth"}).call((function(){h.cardContainer.children.forEach((function(n){return n.active=!0})),h.selectCardGuide.getComponent(u).opacity=255,h.resultStage.active=!1,t.getComponent(o).interactable=!0,h.selectCardStage.active=!0})).start()},g.selectCard=function(n,h){var t=this,i=this.cards[Math.floor(Math.random()*this.cards.length)];this.inputBlock.active=!0;var c=n.target,g=l(c);g.getComponent(o).destroy(),c.active=!1,this.node.addChild(g),r(this.selectCardGuide.getComponent(u)).to(.5,{opacity:0},{easing:"smooth"}).start();var a=r(this.resultCard).to(.5,{scale:new s(1,1,0)},{easing:"smooth"}),e=r(this.resultStage.getComponent(u)).set({opacity:0}).to(2,{opacity:255},{easing:"smooth"}),m=r(g).delay(.25).to(.5,{scale:new s(0,.37,0)},{easing:"smooth"}).call((function(){"No"===i.value?(t.resultCardYes.active=!1,t.resultCardNo.active=!0):(t.resultCardYes.active=!0,t.resultCardNo.active=!1),t.resultCardName.string=i.card_name,t.resultDesc.string=i.description,t.selectCardStage.active=!1,t.inputBlock.active=!1,t.resultStage.active=!0,g.destroy(),e.start(),b.load("cards/"+i.card_name+"/spriteFrame",v,(function(n,h){n&&console.log(n),t.resultCard.getComponent(y).spriteFrame=h,a.start()}))})),d=r(g).delay(.5).to(.5,{position:new s(-394.755,.299,0),scale:new s(.37,.37,0)},{easing:"smooth"}).then(m);r(g).to(1,{position:new s(0,0,0),scale:new s(.7,.7,0),angle:360},{easing:"smooth"}).then(d).start()},g.update=function(n){},h}(d)).prototype,"inputBlock",[k],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),S=h(T.prototype,"selectCardStage",[q],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),_=h(T.prototype,"resultStage",[C],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),B=T))||B));g._RF.pop()}}}));

System.register("chunks:///_virtual/main",["./BootController.ts","./GameController.ts","./SoundManager.ts","./debug-view-runtime-control.ts"],(function(){return{setters:[null,null,null,null],execute:function(){}}}));

System.register("chunks:///_virtual/SoundManager.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(n){var t,o,e,r,u;return{setters:[function(n){t=n.inheritsLoose},function(n){o=n.cclegacy,e=n._decorator,r=n.AudioSource,u=n.Component}],execute:function(){var a;o._RF.push({},"9742cWzzH5O0KHeM4aytvhk","SoundManager",void 0);var c=e.ccclass;e.property,n("SoundManager",c("SoundManager")(a=function(n){function o(){return n.apply(this,arguments)||this}t(o,n);var e=o.prototype;return e.start=function(){},e.drawCardSound=function(){this.node.getChildByName("Draw Card").getComponent(r).play()},e.buttonClickSound=function(){this.node.getChildByName("Button Click").getComponent(r).play()},e.update=function(n){},o}(u))||a);o._RF.pop()}}}));

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