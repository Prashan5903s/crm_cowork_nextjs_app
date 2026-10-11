"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.authOptions = void 0;

var _credentials = _interopRequireDefault(require("next-auth/providers/credentials"));

var _google = _interopRequireDefault(require("next-auth/providers/google"));

var _prismaAdapter = require("@auth/prisma-adapter");

var _client = require("@prisma/client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Third-party Imports
var prisma = new _client.PrismaClient();
var authOptions = {
  adapter: (0, _prismaAdapter.PrismaAdapter)(prisma),
  // ** Configure one or more authentication providers
  // ** Please refer to https://next-auth.js.org/configuration/options#providers for more `providers` options
  providers: [(0, _credentials["default"])({
    // ** The name to display on the sign in form (e.g. 'Sign in with...')
    // ** For more details on Credentials Provider, visit https://next-auth.js.org/providers/credentials
    name: 'Credentials',
    type: 'credentials',

    /*
     * As we are using our own Sign-in page, we do not need to change
     * username or password attributes manually in following credentials object.
     */
    credentials: {},
    authorize: function authorize(credentials) {
      var email, password, fcm_token, isNotMobile, res, data;
      return regeneratorRuntime.async(function authorize$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              email = credentials.email, password = credentials.password, fcm_token = credentials.fcm_token;
              isNotMobile = true;
              _context.prev = 2;
              _context.next = 5;
              return regeneratorRuntime.awrap(fetch("".concat(process.env.API_URL, "/auth/login"), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email: email,
                  password: password,
                  isNotMobile: isNotMobile,
                  fcm_token: fcm_token
                })
              }));

            case 5:
              res = _context.sent;
              _context.next = 8;
              return regeneratorRuntime.awrap(res.json());

            case 8:
              data = _context.sent;

              if (res.ok) {
                _context.next = 11;
                break;
              }

              return _context.abrupt("return", null);

            case 11:
              return _context.abrupt("return", {
                name: data.name,
                email: data.email,
                token: data.token,
                photo: data.photo,
                userId: data.userId,
                expiresAt: data.expiresAt
              });

            case 14:
              _context.prev = 14;
              _context.t0 = _context["catch"](2);
              console.error('Authorize error:', _context.t0);
              return _context.abrupt("return", null);

            case 18:
            case "end":
              return _context.stop();
          }
        }
      }, null, null, [[2, 14]]);
    }
  }), (0, _google["default"])({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }) // ** ...add more providers here
  ],
  // ** Please refer to https://next-auth.js.org/configuration/options#session for more `session` options
  session: {
    /*
     * Choose how you want to save the user session.
     * The default is `jwt`, an encrypted JWT (JWE) stored in the session cookie.
     * If you use an `adapter` however, NextAuth default it to `database` instead.
     * You can still force a JWT session by explicitly defining `jwt`.
     * When using `database`, the session cookie will only contain a `sessionToken` value,
     * which is used to look up the session in the database.
     * If you use a custom credentials provider, user accounts will not be persisted in a database by NextAuth.js (even if one is configured).
     * The option to use JSON Web Tokens for session tokens must be enabled to use a custom credentials provider.
     */
    strategy: 'jwt',
    // ** Seconds - How long until an idle session expires and is no longer valid
    maxAge: 30 * 24 * 60 * 60 // ** 30 days

  },
  // ** Please refer to https://next-auth.js.org/configuration/options#pages for more `pages` options
  pages: {
    signIn: '/login'
  },
  // ** Please refer to https://next-auth.js.org/configuration/options#callbacks for more `callbacks` options
  callbacks: {
    /*
     * While using `jwt` as a strategy, `jwt()` callback will be called before
     * the `session()` callback. So we have to add custom parameters in `token`
     * via `jwt()` callback to make them accessible in the `session()` callback
     */
    jwt: function jwt(_ref) {
      var token, user;
      return regeneratorRuntime.async(function jwt$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              token = _ref.token, user = _ref.user;

              if (user) {
                /*
                 * For adding custom parameters to user in session, we first need to add those parameters
                 * in token which then will be available in the `session()` callback
                 */
                token.name = user.name;
                token.photo = user.photo;
                token.email = user.email;
                token.token = user.token;
                token.userId = user.userId;
                token.expiresAt = user.expiresAt;
              }

              return _context2.abrupt("return", token);

            case 3:
            case "end":
              return _context2.stop();
          }
        }
      });
    },
    session: function session(_ref2) {
      var _session, token;

      return regeneratorRuntime.async(function session$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _session = _ref2.session, token = _ref2.token;

              if (_session.user) {
                // ** Add custom params to user in session which are added in `jwt()` callback via `token` parameter
                _session.user.email = token.email;
                _session.user.name = token.name;
                _session.user.photo = token.photo;
                _session.user.token = token.token;
                _session.user.userId = token.userId;
                _session.user.expiresAt = token.expiresAt;
              }

              return _context3.abrupt("return", _session);

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
  }
};
exports.authOptions = authOptions;