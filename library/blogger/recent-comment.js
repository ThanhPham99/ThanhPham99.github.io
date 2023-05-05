function idbcomments(_0x80b1x2) {
  var _0x80b1x3;
  _0x80b1x3 = '<ul class="idbcomments">';
  for (var _0x80b1x4 = 0; numComments > _0x80b1x4; _0x80b1x4++) {
    var _0x80b1x5, _0x80b1x6, _0x80b1x7, _0x80b1x8;
    if (_0x80b1x4 == _0x80b1x2['feed']['entry']['length']) {
      break
    };
    _0x80b1x3 += '<li>';
    for (var _0x80b1x9 = _0x80b1x2['feed']['entry'][_0x80b1x4], _0x80b1xa = 0; _0x80b1xa < _0x80b1x9['link']['length']; _0x80b1xa++) {
      'alternate' == _0x80b1x9['link'][_0x80b1xa]['rel'] && (_0x80b1x5 = _0x80b1x9['link'][_0x80b1xa]['href'])
    };
    for (var _0x80b1xb = 0; _0x80b1xb < _0x80b1x9['author']['length']; _0x80b1xb++) {
      _0x80b1x6 = _0x80b1x9['author'][_0x80b1xb]['name']['$t'], _0x80b1x7 = _0x80b1x9['author'][_0x80b1xb]['gd$image']['src']
    };
    _0x80b1x7 = -1 != _0x80b1x7['indexOf']('/s1600/') ? _0x80b1x7['replace']('/s1600/', '/s' + avatarSize + '-c/') : -1 != _0x80b1x7['indexOf']('/s220/') ? _0x80b1x7['replace']('/s220/', '/s' + avatarSize + '-c/') : -1 != _0x80b1x7['indexOf']('/s512-c/') && 0 != _0x80b1x7['indexOf']('http:') ? 'http:' + _0x80b1x7['replace']('/s512-c/', '/s' + avatarSize + '-c/') : -1 != _0x80b1x7['indexOf']('blogblog.com/img/b16-rounded.gif') ? 'http://1.bp.blogspot.com/-7bkcAKdpGXI/UrbyQRqvSKI/AAAAAAAAFmI/oBv_yMeYnMQ/s' + avatarSize + '/blogger.png' : -1 != _0x80b1x7['indexOf']('blogblog.com/img/openid16-rounded.gif') ? 'http://2.bp.blogspot.com/-VgnInuIUKBU/UrbzyXTYWRI/AAAAAAAAFmU/3f_Vfj3TI6A/s' + avatarSize + '/openid.png' : -1 != _0x80b1x7['indexOf']('blogblog.com/img/blank.gif') ? -1 != defaultAvatar['indexOf']('gravatar.com') ? defaultAvatar + '&s=' + avatarSize : defaultAvatar : _0x80b1x7, 1 == showAvatar && (_0x80b1x8 = 1 == roundAvatar ? 'avatarRound' : '', _0x80b1x3 += '<div class="avatarImage ' + _0x80b1x8 + '"><img class="' + _0x80b1x8 + '" src="' + _0x80b1x7 + '" alt="' + _0x80b1x6 + '" width="' + avatarSize + '" height="' + avatarSize + '"/></div>'), _0x80b1x3 += '<a href="' + _0x80b1x5 + '">' + _0x80b1x6 + '</a>';
    var _0x80b1xc = _0x80b1x9['content']['$t'],
      _0x80b1xd = _0x80b1xc['replace'](/(<([^>]+)>)/gi, '');
    '' != _0x80b1xd && _0x80b1xd['length'] > characters ? (_0x80b1xd = _0x80b1xd['substring'](0, characters), _0x80b1xd += '&hellip;', 1 == showMorelink && (_0x80b1xd += '<a href="' + _0x80b1x5 + '">' + moreLinktext + '</a>')) : _0x80b1xd = _0x80b1xd, _0x80b1x3 += '<span>' + _0x80b1xd + '</span>', _0x80b1x3 += '</li>'
  };
  _0x80b1x3 += '</ul>';
  var _0x80b1xe = '';
  0 == hideCredits && (_0x80b1xe = 'display:block;'), _0x80b1x3 += '', document['write'](_0x80b1x3)
}
var numComments = 5,
  showAvatar = !0,
  avatarSize = 42,
  roundAvatar = !0,
  characters = 40,
  showMorelink = !1,
  defaultAvatar = 'https://1.bp.blogspot.com/-m2JqA8HH-JY/V1Y9Z1SpzpI/AAAAAAAAEEY/jnJ-r_-Ta0UadbOE84Egdea5jfcwPSSvwCLcB/s1600/noimage.png',
  hideCredits = !0,
  numComments = numComments || 5,
  avatarSize = avatarSize || 60,
  characters = characters || 40,
  defaultAvatar = defaultAvatar || 'https://1.bp.blogspot.com/-m2JqA8HH-JY/V1Y9Z1SpzpI/AAAAAAAAEEY/jnJ-r_-Ta0UadbOE84Egdea5jfcwPSSvwCLcB/s1600/noimage.png',
  moreLinktext = moreLinktext || ' More &raquo;',
  showAvatar = 'undefined' == typeof showAvatar ? !0 : showAvatar,
  showMorelink = 'undefined' == typeof showMorelink ? !1 : showMorelink,
  roundAvatar = 'undefined' == typeof roundAvatar ? !0 : roundAvatar,
  hideCredits = 'undefined' == typeof hideCredits ? !1 : roundAvatar