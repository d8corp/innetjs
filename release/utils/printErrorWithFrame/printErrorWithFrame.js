'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var codeFrame = require('@babel/code-frame');
var chalk = require('chalk');
var fs = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

function printErrorWithFrame(output, deep = 0, hide = false) {
    var _a, _b, _c, _d, _e;
    if (!output)
        return '';
    const input = output.split('\n');
    const start = input.findIndex(line => line.trim().startsWith(deep ? '[cause]: Error:' : 'Error:'));
    if (!~start)
        return output;
    const inputFrame = input.slice(0, start);
    const end = input.slice(start + 1).findIndex(line => line.trim().startsWith('[cause]: Error:'));
    const inputBody = input.slice(start, ~end ? start + end - 1 : undefined);
    const inputCauses = ~end ? input.slice(start + end - 1) : [];
    const bodyStackStart = inputBody.findIndex(line => line.trim().startsWith('at '));
    const bodyText = ~bodyStackStart ? inputBody.slice(0, bodyStackStart).join('\n') : inputBody.join('\n');
    const bodyStack = ~bodyStackStart ? inputBody.slice(bodyStackStart) : [];
    const filePathWithNumber = bodyStack.length ? (_a = bodyStack[0].match(/\(([^(]+)\)$/)) === null || _a === void 0 ? void 0 : _a[1] : undefined;
    const splitFilePath = (_b = filePathWithNumber === null || filePathWithNumber === void 0 ? void 0 : filePathWithNumber.split(':')) !== null && _b !== void 0 ? _b : [];
    const filePath = (_c = splitFilePath[0]) === null || _c === void 0 ? void 0 : _c.trim();
    const line = Number((_d = splitFilePath[1]) !== null && _d !== void 0 ? _d : 1);
    const column = Number((_e = splitFilePath[2]) !== null && _e !== void 0 ? _e : 1);
    let frame = '';
    if (filePath && !filePath.includes('node_modules')) {
        try {
            const source = fs__default["default"].readFileSync(filePath, 'utf8');
            frame = codeFrame.codeFrameColumns(source, { start: { line, column } }, { highlightCode: true });
        }
        catch (e) { }
    }
    else {
        frame = inputFrame.join('\n');
    }
    const title = bodyText.trim();
    const baseOffset = ' '.repeat(2);
    const offset = baseOffset.repeat(deep);
    const titleOffset = offset + baseOffset + baseOffset;
    let hiddenCount = 0;
    let collapse = titleOffset + 'at ... (0 more node_modules calls)';
    const stack = hide
        ? bodyStack.slice(1).reduce((cur, line) => {
            if (line.includes('node_modules')) {
                if (cur.at(-1) === collapse) {
                    collapse = collapse.replace(`${hiddenCount} more`, `${++hiddenCount} more`);
                    return [
                        ...cur.slice(0, -1),
                        collapse,
                    ];
                }
                collapse = collapse.replace(`${hiddenCount} more`, `${++hiddenCount} more`);
                return [...cur, collapse];
            }
            hiddenCount = 0;
            collapse = titleOffset + 'at ... (0 more node_modules calls)';
            return [...cur, line];
        }, [])
        : bodyStack.slice(1);
    return [
        chalk__default["default"].red(`${titleOffset}${title}`),
        bodyStack[0],
        frame && `${offset}${frame.replaceAll('\n', `\n${offset}`)}`,
        ...stack
            .filter(line => line.trim() !== '}')
            .map(line => line.includes('node_modules') ? chalk__default["default"].gray(line) : line),
        printErrorWithFrame(inputCauses.join('\n'), deep + 1, hide),
    ].filter(Boolean).join('\n');
}

exports.printErrorWithFrame = printErrorWithFrame;
