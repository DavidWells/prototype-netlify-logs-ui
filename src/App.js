import React, { useEffect, useState } from 'react'
import logData from './data/logs.json'
import './App.css'

export default function App() {
  const [ logLines, setLogLines ] = useState([])
  const [ linePositions, setLinePosition ] = useState(getStartAndEnd())

  /* simulate log loading lag */
  useEffect(() => {
    setTimeout(() => {
      // Set data
      setLogLines(logData.lines)
      // Automatically scroll to lines when data loaded
      smoothScroll(linePositions)
    }, 1500)
  }, [])

  /* Attach esc key listener */
  useEffect(() => {
    function handleEscKey(e) {
      var key = e.keyCode || e.charCode || 0;
      const commandHeld = e.metaKey
      /* If Command + A pressed, select all logs */
      if (commandHeld && key === 65) {
        e.preventDefault()
        setLinePosition([ 0, logLines.length ])
        updateHashParams(`#L0-L${logLines.length - 1}`)
        selectText('log-info')
      }
      /* If escape key pressed, de-select all logs */
      if (e.which === 27) {
        const [ start, end ] = getStartAndEnd()
        if ((start || start === 0) || end) {
          clearSelection()
          // reset lines
          setLinePosition([ null, null ])
          // Clear all line hash params
          updateHashParams(' ')
        }
      }
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [ logLines ])

  function handleRowSelection(e) {
    e.preventDefault()
    const data = e.target.dataset || {}
    const { lineNum } = data
    /* Shift key is being held, handle multi line select */
    if (e.shiftKey) {
      const [ currentStart ] = linePositions
      const newOrder = [currentStart, Number(lineNum)]
        // remove empty rows
        .filter((val) => hasValue(val))
        // Sort by numerical order
        .sort(ascending)
      setLinePosition(newOrder)
      const hashRange = newOrder.filter((line) => line).map((line) => `L${line}`)
      updateHashParams(`#${hashRange.join('-')}`)
      return false
    }

    // Handle single line click
    updateHashParams(`#L${lineNum}`)
    setLinePosition(getStartAndEnd())
  }

  return (
    <div className="app">
      <GitHubCorner url='https://github.com/DavidWells/netlify-logs-ui' />
      <header className="App-header">
        <h1>Linkable Log Lines</h1>
      </header>
      <div className="misc-stuff">
        <p>Below is a demonstration of how users can select one or many log lines & share the log links with colleagues.
          When these links are visited, users will automatically scroll to the correct number when logs have finished loading.
        </p>
        <p>Click a line number below & the URL will update with the log line number to share!</p>
        <p>To select multiple rows, click a row, hold the "shift" key & then click another row.</p>
        <p>To deselect rows, hit the "esc" key.</p>
        <p>To select all rows, hit the "command + A" keys.</p>
      </div>
      <div className='logs-wrapper'>
        <div className='logs-header'>
          <h2>Deploy Log</h2>
          <div className='logs-actions'>
            <button onClick={notInDemo}>Click to copy...</button>
            <button onClick={notInDemo}>Click to download...</button>
            <button onClick={notInDemo}>Scroll to bottom</button>
            <button onClick={notInDemo}>Scroll to top</button>
          </div>
        </div>
        <LogLines lines={logLines} selected={linePositions} handleRowSelection={handleRowSelection} />
      </div>
    </div>
  )
}

function LogLines({ lines, handleRowSelection, selected }) {
  if (!lines || !lines.length) {
    return <div>Loading....</div>
  }
  const [ start, end ] = selected
  const startValue = (hasValue(start)) ? start : end
  const endValue = (end) ? end : start
  const activeRowRange = getRange(startValue, endValue)
  const allActiveClass = ((activeRowRange.length - 1) === lines.length ) ? ' allActive ' : ''

  const renderLines = lines.map((line, i) => {
    const activeClass = (activeRowRange.includes(i)) ? ' active ' : ''
    return (
      <div key={i} id={`L${i}`} className={`log-line${activeClass}${allActiveClass}`}>
        <div data-line-num={i} className='log-line-number' onClick={handleRowSelection}>
          {`#${i}`}
        </div>
        <div className='log-line-message'>
          {line.msg}
        </div>
      </div>
    )
  })
  return (
    <div id="log-info" className='log-line-container'>
      {renderLines}
    </div>
  )
}

function GitHubCorner({ url }) {
  return (
    <a href={url} target='_blank' rel='noopener noreferrer' className='github-corner' aria-label='View source on GitHub'>
      <svg viewBox='0 0 250 250' aria-hidden='true'>
        <path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' />
        <path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' style={{transformOrigin: '130px 106px'}} className='octo-arm' />
        <path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' className='octo-body' />
      </svg>
    </a>
  )
}

function hasValue(value) {
  return value || value === 0
}

function notInDemo() {
  alert('Not in this demo 😃')
}

function getStartAndEnd() {
  const params = parseHash(window.location.hash)
  return getLineNumbersFromHash(params)
}

function selectText(containerid) {
  if (document.selection) { // IE
    const range = document.body.createTextRange()
    range.moveToElementText(document.getElementById(containerid));
    range.select();
  } else if (window.getSelection) {
    const range = document.createRange()
    range.selectNode(document.getElementById(containerid));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges()
  } else if (document.selection) {
    document.selection.empty()
  }
}

// Because URLSearchParams not fully supported https://caniuse.com/#feat=urlsearchparams
function parseHash(hash) {
  if (!hash) return {}
  return hash.replace(/^#/, '').split('&').reduce((result, pair) => {
    const keyValue = pair.split('=')
    result[keyValue[0]] = decodeURIComponent((keyValue[1])).replace(/\+/g, ' ')
    return result
  }, {})
}

const IS_LINE_PARAM = /^L\d+/gm
const LINE_REGEX = /(L\d+)/gm
function getLineNumbersFromHash(params) {
  return Object.keys(params).reduce((acc, key) => {
    if (acc.length) return acc
    if (key.match(IS_LINE_PARAM)) {
      const matches = key.match(LINE_REGEX)
      return matches
    }
    return acc
  }, []).map((lineNumber) => {
    if (lineNumber || lineNumber === '0') {
      return Number(lineNumber.replace(/^L/, ''))
    }
    return lineNumber
  }).sort(ascending)
}

const ascending = (a, b) => a - b

/* Generate range array from 2 numbers */
function getRange(start, end) {
  if ((start || start === 0) || (end || end === 0)) {
    return Array.apply(null, Array((end - start) + 1)).map((_, index) => index + start)
  }
  return []
}

/* Thanks https://codepen.io/a8t/pen/JOYwLM?editors=0010 */
function smoothScroll(linePositions, callback) {
  const [ start, end ] = linePositions
  const element = document.getElementById(`L${start}`)
  if (!element) return
  const paddingTop = 150
  const distance = distanceToTop(element)
  const originalTop = distance - paddingTop

  // Do the scrolling
  window.scrollTo({ top: originalTop, left: 0, behavior: 'smooth' })

  const checkIfDone = setInterval(function() {
    const atBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 2
    const positionInWindow = distanceToTopOfWindow(element)
    // console.log('positionInWindow', positionInWindow)
    if (positionInWindow === paddingTop || atBottom) {
      element.tabIndex = "-1"
      element.focus()
      // window.history.pushState("", "", `#L${targetID}`)
      if (callback && typeof callback === 'function') {
        callback()
      }
      clearInterval(checkIfDone)
    }
  }, 100)
}

function updateHashParams(hash) {
  if (window.history) {
    window.history.pushState("", "", hash)
  } else {
    window.location.hash = hash
  }
}

function distanceToTopOfWindow(element) {
  if (!element) return 0
  const bounds = element.getBoundingClientRect()
  return Math.floor(bounds.y)
}

function distanceToTop(element) {
  if (!element) return 0
  const bounds = element.getBoundingClientRect()
  return Math.floor(window.pageYOffset + bounds.y)
}
