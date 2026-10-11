"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFirebaseMessaging = void 0;

var _app = require("firebase/app");

var _messaging = require("firebase/messaging");

var firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
var app = (0, _app.getApps)().length ? (0, _app.getApp)() : (0, _app.initializeApp)(firebaseConfig);

var getFirebaseMessaging = function getFirebaseMessaging() {
  var supported;
  return regeneratorRuntime.async(function getFirebaseMessaging$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(typeof window === "undefined")) {
            _context.next = 2;
            break;
          }

          return _context.abrupt("return", null);

        case 2:
          _context.next = 4;
          return regeneratorRuntime.awrap((0, _messaging.isSupported)());

        case 4:
          supported = _context.sent;

          if (supported) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", null);

        case 7:
          return _context.abrupt("return", (0, _messaging.getMessaging)(app));

        case 8:
        case "end":
          return _context.stop();
      }
    }
  });
};

exports.getFirebaseMessaging = getFirebaseMessaging;