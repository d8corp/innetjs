import { NPM_TAG } from '../../constants'

export function getNpmTag (version: string) {
  const match = version.match(NPM_TAG)
  return match ? match[1] : 'latest'
}
