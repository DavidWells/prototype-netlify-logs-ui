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
      const newOrder = [currentStart, Number(lineNum)].sort(ascending)
      setLinePosition(newOrder)
      const hashRange = newOrder.map((line) => `L${line}`)
      updateHashParams(`#${hashRange.join('-')}`)
      return false
    }

    // Handle single line click
    updateHashParams(`#L${lineNum}`)
    setLinePosition(getStartAndEnd())
  }

  return (
    <div className="app">
      <header className="App-header">
        <h1>Linkable Log Lines</h1>
      </header>
      <div className="misc-stuff">
        <p>Below is a demonstration of how users can select one or many log lines & share with colleagues. Click a line number below to see it in action.</p>
        <p>To select multiple rows, hold shift & click.</p>
        <p>When log links with line numbers are visited, users will automatically scroll to the correct number when logs have finished loading.</p>
      </div>
      <div className='logs-wrapper'>
        <h2>Logs</h2>
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
  const renderLines = lines.map((line, i) => {
    const activeRange = range(start, (end || start))
    const activeClass = (activeRange.includes(i)) ? ' active ' : ''
    const allActiveClass = ((activeRange.length - 1) === lines.length ) ? ' allActive ' : ''
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
      console.log('matches', matches)
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
function range(start, end) {
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
