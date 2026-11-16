const mockResults = {
  notAi: {
    status: 'notAi',
    riskLevel: 'low',
    confidence: 'high',
    indicators: ['notAi'],
  },
  aiGenerated: {
    status: 'aiGenerated',
    riskLevel: 'high',
    confidence: 'medium',
    indicators: ['aiGenerated'],
  },
  unclear: {
    status: 'unclear',
    riskLevel: 'suspicious',
    confidence: 'limited',
    indicators: ['unclear'],
  },
}

// Simulates an analysis request and returns one of the three demo result shapes.
export function analyzeContent(_input, selectedResult = 'unclear') {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ...mockResults[selectedResult] }), 2000)
  })
}
