const asset = (filename) => `/assets/${filename}`;

export const ASSETS = Object.freeze({
  waveBorder: asset('Headbanner.png'),
  waveFoam: asset('1.png'),
  bubble: asset('2.png'),
  waveCap: asset('orange-cap.png'),
  appIcon: asset('4.png'),
  surfyPoint: asset('5.png'),
  surfyCheer: asset('6.png'),
  surfyTablet: asset('7.png'),
  surfyAlarm: asset('8.png'),
  surfyWink: asset('9.png'),
  surfySurfingLeft: asset('surfy-surfing-left.png'),
  surfyMagnify: asset('10.png'),
  iconWarning: asset('11.png'),
  iconAlert: asset('12.png'),
  emptyBox: asset('13.png'),
});

export const MASCOT_BY_STATE = Object.freeze({
  low: ASSETS.surfyCheer,
  suspicious: ASSETS.surfyPoint,
  high: ASSETS.surfyAlarm,
  notEnoughInfo: ASSETS.surfyMagnify,
  ready: Object.freeze({
    illustration: ASSETS.emptyBox,
    mascot: ASSETS.surfyMagnify,
  }),
});
