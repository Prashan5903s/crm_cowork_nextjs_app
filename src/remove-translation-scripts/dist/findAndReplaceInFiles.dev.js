"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findAndReplaceInFiles = void 0;

var _consola = require("consola");

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _globby = require("globby");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getUrlPattern = /getLocalizedUrl\((['"`]\/)(.*)(['"`]), locale\)/g;
var getUrlPattern2 = /getLocalizedUrl\((.*), locale\)/g;
var getUrlPattern3 = /getLocalizedUrl\((.*), lang\)/g;
var getDictionaryPropPattern = /dictionary={dictionary}/g;
var removeDictionaryPattern = /=\s(dictionary)\s=>/;
var getDictionaryProp = /const\s+dictionary\s+=\s+await\s+getDictionary\(params\.lang\)\s*/g;
var replaceDirectionPattern = /const direction\s*=\s*i18n.langDirection\[params.lang\]/g;
var removeDictionaryDestructuringPattern = /dictionary(,| )/g; // Pattern to match Props type definitions including `params`

var removeParamsFromFunctionPattern = /(?<={ .*)params,?(?=.* }: [A-Z][A-Za-z]+)/g;
var excludeLangPattern = /excludeLang\??:\s.*,?/g;

function replacePatternInFile(filePath) {
  var data, newData;
  return regeneratorRuntime.async(function replacePatternInFile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_fsExtra["default"].readFile(filePath, 'utf8'));

        case 2:
          data = _context.sent;

          if (!(getUrlPattern.test(data) || getUrlPattern2.test(data) || getUrlPattern3.test(data) || getDictionaryPropPattern.test(data) || removeDictionaryPattern.test(data) || getDictionaryProp.test(data) || replaceDirectionPattern.test(data) || removeDictionaryDestructuringPattern.test(data) || removeParamsFromFunctionPattern.test(data) || excludeLangPattern.test(data))) {
            _context.next = 11;
            break;
          }

          // Perform replacements
          newData = data.replace(getUrlPattern, '$1$2$3').replace(getUrlPattern2, '$1').replace(getUrlPattern3, '$1').replace(getDictionaryPropPattern, '').replace(removeDictionaryPattern, '= () => ').replace(getDictionaryProp, '').replace(replaceDirectionPattern, "const direction = 'ltr'").replace(removeDictionaryDestructuringPattern, '').replace(removeParamsFromFunctionPattern, '').replace(/const\s*{\s*lang:\s*locale\s*}\s*=\s*useParams\(\)/g, '').replace(/(\w+: )?locale,/g, '').replace(/,\s*(\w+: )?locale/g, '').replace(/\{ lang \}: \{ lang: Locale \}/g, '').replace(/\${lang}\//g, '').replace(/props: \{ params: Promise<\{ lang: Locale \}> \}/gm, '').replace(/excludeLang\??:\s.*,?/g, '').replace(/item\.excludeLang.*?:/, ''); // Only write back if changes were made

          if (!(data !== newData)) {
            _context.next = 10;
            break;
          }

          _context.next = 8;
          return regeneratorRuntime.awrap(_fsExtra["default"].writeFile(filePath, newData, 'utf8'));

        case 8:
          _context.next = 11;
          break;

        case 10:
          _consola.consola.error("No changes made to: ".concat(filePath));

        case 11:
        case "end":
          return _context.stop();
      }
    }
  });
}

function updateNextConfig() {
  var filePath, content, redirectsPattern, redirect, updatedContent;
  return regeneratorRuntime.async(function updateNextConfig$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          filePath = 'next.config.mjs';
          _context2.next = 3;
          return regeneratorRuntime.awrap(_fsExtra["default"].readFile(filePath, 'utf8'));

        case 3:
          content = _context2.sent;
          // Define a pattern that matches the redirects configuration and remove it
          redirectsPattern = /(return \[[\s\S]*?\]\s*)/;
          redirect = "return [{\n    source: '/',\n    destination: '/dashboard',\n    permanent: true\n  }]";
          updatedContent = content.replace(redirectsPattern, redirect);

          if (!(content !== updatedContent)) {
            _context2.next = 11;
            break;
          }

          _context2.next = 10;
          return regeneratorRuntime.awrap(_fsExtra["default"].writeFile(filePath, updatedContent, 'utf8'));

        case 10:
          _consola.consola.success('Removed redirects from next.config.mjs\n');

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  });
}

var findAndReplaceInFiles = function findAndReplaceInFiles() {
  var paths, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, filePath;

  return regeneratorRuntime.async(function findAndReplaceInFiles$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap((0, _globby.globby)(['src/**/*.{jsx,js}', '!src/remove-translation-scripts/**/*']));

        case 2:
          paths = _context3.sent;

          _consola.consola.start('Replacing various patterns in whole project......');

          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context3.prev = 7;
          _iterator = paths[Symbol.iterator]();

        case 9:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context3.next = 16;
            break;
          }

          filePath = _step.value;
          _context3.next = 13;
          return regeneratorRuntime.awrap(replacePatternInFile(filePath));

        case 13:
          _iteratorNormalCompletion = true;
          _context3.next = 9;
          break;

        case 16:
          _context3.next = 22;
          break;

        case 18:
          _context3.prev = 18;
          _context3.t0 = _context3["catch"](7);
          _didIteratorError = true;
          _iteratorError = _context3.t0;

        case 22:
          _context3.prev = 22;
          _context3.prev = 23;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 25:
          _context3.prev = 25;

          if (!_didIteratorError) {
            _context3.next = 28;
            break;
          }

          throw _iteratorError;

        case 28:
          return _context3.finish(25);

        case 29:
          return _context3.finish(22);

        case 30:
          _consola.consola.success('Replaced pattern successfully\n');

          _context3.next = 33;
          return regeneratorRuntime.awrap(updateNextConfig());

        case 33:
          _consola.consola.success('Replaced various patterns in whole project successfully.\n');

        case 34:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[7, 18, 22, 30], [23,, 25, 29]]);
};

exports.findAndReplaceInFiles = findAndReplaceInFiles;