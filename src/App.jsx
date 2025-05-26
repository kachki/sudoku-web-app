import { useState } from 'react'
import './App.css'

function emptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(''))
}

function isValid(grid, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num) return false
  }
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] === num) return false
    }
  }
  return true
}

function solveSudoku(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === '' || grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num
            if (solveSudoku(grid)) return true
            grid[row][col] = ''
          }
        }
        return false
      }
    }
  }
  return true
}

function App() {
  const [grid, setGrid] = useState(emptyGrid())
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const [isUnsolvable, setIsUnsolvable] = useState(false)
  const [originalCells, setOriginalCells] = useState(new Set())
  const [solvingAnimation, setSolvingAnimation] = useState(false)

  const handleInput = (row, col, value) => {
    if (isUnsolvable) return;
    if (value === '' || (/^[1-9]$/.test(value) && value.length === 1)) {
      const newGrid = grid.map((r) => [...r])
      newGrid[row][col] = value
      setGrid(newGrid)
      setSolved(false)
      setError('')
      setIsUnsolvable(false)
      // Track original cells
      if (value !== '') {
        setOriginalCells(prev => new Set([...prev, `${row}-${col}`]))
      } else {
        setOriginalCells(prev => {
          const newSet = new Set(prev)
          newSet.delete(`${row}-${col}`)
          return newSet
        })
      }
    }
  }

  const animateSolution = async (solutionGrid) => {
    setSolvingAnimation(true)
    const newGrid = grid.map(row => [...row])
    const emptyCells = []
    
    // Find all empty cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === '') {
          emptyCells.push({ row, col })
        }
      }
    }

    // Shuffle empty cells for random animation
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]]
    }

    // Animate filling each cell
    for (const { row, col } of emptyCells) {
      newGrid[row][col] = solutionGrid[row][col].toString()
      setGrid([...newGrid])
      await new Promise(resolve => setTimeout(resolve, 50)) // 50ms delay between each cell
    }

    setSolvingAnimation(false)
    setSolved(true)
  }

  const handleSolve = async () => {
    const workingGrid = grid.map((row) => row.map((cell) => (cell === '' ? '' : Number(cell))))
    if (solveSudoku(workingGrid)) {
      await animateSolution(workingGrid)
      setError('')
      setIsUnsolvable(false)
    } else {
      setError('This puzzle is unsolvable! Please check your input and try again.')
      setSolved(false)
      setIsUnsolvable(true)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const rows = text.trim().split(/\r?\n/)
      if (rows.length !== 9) {
        setError('File must have 9 lines.')
        return
      }
      const newGrid = rows.map((row) => {
        const nums = row.trim().split(/\s+/);
        if (nums.length !== 9) {
          setError('Each line must have 9 numbers.')
          return Array(9).fill('')
        }
        return nums.map((n) => (n === '0' || n === '.' ? '' : n))
      })
      setGrid(newGrid)
      setSolved(false)
      setError('')
      setIsUnsolvable(false)
      
      // Track original cells from file
      const newOriginalCells = new Set()
      newGrid.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell !== '') {
            newOriginalCells.add(`${i}-${j}`)
          }
        })
      })
      setOriginalCells(newOriginalCells)
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setGrid(emptyGrid())
    setSolved(false)
    setError('')
    setIsUnsolvable(false)
    setOriginalCells(new Set())
  }

  return (
    <div className="sudoku-app">
      <h1>Sudoku Solver</h1>
      <div className="sudoku-controls">
        <input type="file" accept=".txt" onChange={handleFileUpload} />
        <button onClick={handleSolve} disabled={solvingAnimation}>
          {solvingAnimation ? 'Solving...' : 'Solve'}
        </button>
        <button onClick={handleClear}>Clear</button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className={`sudoku-grid ${isUnsolvable ? 'unsolvable' : ''}`}>
        {grid.map((row, i) => (
          <div className="sudoku-row" key={i}>
            {row.map((cell, j) => (
              <input
                key={j}
                className={`sudoku-cell ${originalCells.has(`${i}-${j}`) ? 'original' : ''}`}
                type="text"
                maxLength={1}
                value={cell}
                onChange={(e) => handleInput(i, j, e.target.value)}
                disabled={solved && cell !== '' || isUnsolvable || solvingAnimation}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="instructions">
        <p>Type numbers (1-9) or upload a .txt file with 9 lines of 9 numbers (0 or . for empty cells).</p>
      </div>
    </div>
  )
}

export default App
