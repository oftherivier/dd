var hash = require('./hash')
var resolve = require('./utils/resolve')
var hash2 = hash.hash2

var EPS = 0.0001

function oneOfWeighted(a, b) {
  return b != null ? oneOfWeightedMain(a, b) : oneOfWeightedCurried(a)
}

function oneOfWeightedMain(input, samples) {
  samples = parseSamples(samples)
  var id = hash2(input, 'oneOfWeighted')
  var prob = (id % 1000000) / 1000000

  var cumulative = 0
  for (var i = 0; i < samples.length; i++) {
    cumulative += samples[i][0]
    if (prob < cumulative) {
      return resolve(id, samples[i][1])
    }
  }

  throw new Error(
    'Unexpectedly reached end of oneOfWeighted() unresolved. If you see this please file a bug.'
  )
}

function oneOfWeightedCurried(samples) {
  samples = parseSamples(samples)

  return function oneOfWeightedCurriedFn(input) {
    return oneOfWeighted(input, samples)
  }
}

function parseSamples(samples) {
  if (samples.__parsed) {
    return samples
  }

  var samplesLen = samples.length
  var assignedPs = getAssignedPs(samples)
  var sumAssignedPs = assignedPs.reduce(add, 0)
  var assignedPsLen = assignedPs.length

  if (!samplesLen) {
    throw new Error('Empty samples given to oneOfWeighted')
  }

  if (sumAssignedPs > 1 + EPS) {
    throw new Error(
      'Assigned probabilities add up more than 1: ' + JSON.stringify(assignedPs)
    )
  } else if (samplesLen === assignedPsLen && sumAssignedPs < 1 - EPS) {
    throw new Error(
      'All items were assigned probabilities, yet the probabilities add up to less than 1: ' +
        JSON.stringify(assignedPs)
    )
  }

  var defaultP = (1 - sumAssignedPs) / (samplesLen - assignedPsLen)
  return ensurePs(samples, defaultP)
}

function ensurePs(samples, defaultP) {
  var result = []
  var i = -1
  var n = samples.length
  var sample
  var p

  while (++i < n) {
    sample = samples[i]
    p = sample[0]

    if (typeof p !== 'number') {
      p = defaultP
    }

    result.push([p, sample[1]])
  }

  result.__parsed = true
  return result
}

function getAssignedPs(samples) {
  var i = -1
  var n = samples.length
  var result = []
  var p

  while (++i < n) {
    p = samples[i][0]

    if (typeof p === 'number') {
      result.push(p)
    }
  }

  return result
}

function add(a, b) {
  return a + b
}

module.exports = oneOfWeighted
