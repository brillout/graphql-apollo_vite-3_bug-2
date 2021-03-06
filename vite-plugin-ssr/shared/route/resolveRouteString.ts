export { resolveRouteString }
export { isStaticRouteString }
export { analyzeRouteString }
export { PARAM_TOKENS }
export { PARAM_TOKEN_NEW }

import { assertWarning } from '../utils'
import { assert, assertUsage } from './utils'

const PARAM_TOKEN_NEW = '@'
const PARAM_TOKEN_OLD = ':'
const PARAM_TOKENS = [PARAM_TOKEN_NEW, PARAM_TOKEN_OLD]

function resolveRouteString(routeString: string, urlPathname: string): null | { routeParams: Record<string, string> } {
  assertUsage(
    routeString === '*' || routeString.startsWith('/'),
    `Invalid route string \`${routeString}\`${
      routeString === '' ? ' (empty string)' : ''
    }: route strings should start with a leading slash \`/\` (or be \`*\`).`,
  )
  assert(urlPathname.startsWith('/'))

  const routeParts = routeString.split('/')
  const urlParts = urlPathname.split('/')

  const routeParams: Record<string, string> = {}

  assertGlob(routeString)

  if (routeString === '*') {
    routeString = '/*'
  }

  //console.log(routeString, urlPathname)
  for (let i = 0; i < Math.max(routeParts.length, urlParts.length); i++) {
    const routeDir = routeParts[i]
    const urlDir = urlParts[i]
    if (routeDir === '*') {
      routeParams['*'] = urlParts.slice(Math.max(1, i)).join('/')
      return { routeParams }
    } else if (routeDir && (routeDir.startsWith(PARAM_TOKEN_NEW) || routeDir.startsWith(PARAM_TOKEN_OLD))) {
      assertWarning(
        !routeDir.startsWith(PARAM_TOKEN_OLD),
        `Outdated route string \`${routeString}\`, use \`${routeString
          .split(PARAM_TOKEN_OLD)
          .join(PARAM_TOKEN_NEW)}\` instead.`,
        { onlyOnce: true },
      )
      if (!urlDir) {
        return null
      }
      routeParams[routeDir.slice(1)] = urlDir
    } else {
      if ((routeDir || '') !== (urlDir || '')) {
        return null
      }
    }
  }

  return { routeParams }
}

function assertGlob(routeString: string) {
  const numberOfGlobChars = routeString.split('*').length - 1
  assertUsage(
    numberOfGlobChars <= 1,
    `Invalid route string \`${routeString}\`: route strings are not allowed to contain more than one glob character \`*\`.`,
  )
  assertUsage(
    numberOfGlobChars === 0 || (numberOfGlobChars === 1 && routeString.endsWith('*')),
    `Invalid route string \`${routeString}\`: make sure your route string ends with the glob character \`*\`.`,
  )
}
function analyzeRouteString(routeString: string) {
  const pathSegments = routeString.split('/').filter((path) => path !== '' && path !== '*')

  const isStatic = (path: string) => !path.startsWith(':')

  let numberOfStaticSegmentsBeginning = 0
  for (const path of pathSegments) {
    if (!isStatic(path)) {
      break
    }
    numberOfStaticSegmentsBeginning++
  }

  const numberOfStaticSegements = pathSegments.filter((p) => isStatic(p)).length
  const numberOfParameterSegments = pathSegments.filter((p) => !isStatic(p)).length

  const isCatchAll = routeString.endsWith('*')

  return { numberOfParameterSegments, numberOfStaticSegmentsBeginning, numberOfStaticSegements, isCatchAll }
}

function isStaticRouteString(routeString: string): boolean {
  const url = routeString
  const match = resolveRouteString(routeString, url)
  return match !== null && Object.keys(match.routeParams).length === 0
}
