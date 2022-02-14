function makeQuery(data, level: string = '') {
  let result: string[] = []
  for (let item in data) {
    const value = data[item]
    if (!(typeof value === 'object' && value !== null) && !Array.isArray(value)) {
      const encodedValue = encodeURIComponent(value)
      if (!level) {
        result.push(`${item}=${encodedValue}`)
      } else {
        result.push(`${level}[${item}]=${encodedValue}`)
      }
    } else if (typeof value === 'object' && value !== null) {
      result = result.concat(makeQuery(value, level ? `${level}[${item}]` : item).raw())
    }
  }

  return {
    raw: () => {
      return result
    },
    string: () => {
      return result.join('&')
    },
  }
}

export default makeQuery
