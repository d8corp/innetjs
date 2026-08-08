import { NPM_TAG } from '../../constants.mjs';

function getNpmTag(version) {
    const match = version.match(NPM_TAG);
    return match ? match[1] : 'latest';
}

export { getNpmTag };
