'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var constants = require('../../constants.js');

function getNpmTag(version) {
    const match = version.match(constants.NPM_TAG);
    return match ? match[1] : 'latest';
}

exports.getNpmTag = getNpmTag;
