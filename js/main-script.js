

// ============================================================================
// NAVIGATION AND VIEW MANAGEMENT (Simplified for multi-page)
// ============================================================================

// These functions now simply redirect to the respective HTML pages
function showDashboard() {
  window.location.href = "main-page.html"
}

function showAddMetric() {
  window.location.href = "add-metric.html"
}

function showHistory() {
  window.location.href = "my-dailylogs.html"
}

function showGoals() {
  window.location.href = "my-targets.html"
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

/**
 * Setup all event listeners for the application
 * Handles form submissions, button clicks, and other user interactions
 */
function setupEventListeners() {
  console.log("🎯 Setting up event listeners...")

  // Form submission for adding new health metrics (on add-daily-log.html)
  const healthForm = document.getElementById("healthForm")
  if (healthForm) {
    healthForm.addEventListener("submit", handleFormSubmit)
  }

  // Metric type change handler (on add-daily-log.html)
  const metricTypeSelect = document.getElementById("metricType")
  if (metricTypeSelect) {
    metricTypeSelect.addEventListener("change", handleMetricTypeChange)
  }

  // History filter change handler (on history.html)
  const historyFilter = document.getElementById("historyFilter")
  if (historyFilter) {
    historyFilter.addEventListener("change", updateHistory)
  }

  // Clear history button (on history.html)
  const clearHistoryBtn = document.getElementById("clearHistory")
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory)
  }

  // Metric card click handlers for detailed view (on index.html)
  document.querySelectorAll(".metric-card").forEach((card) => {
    card.addEventListener("click", function () {
      const metric = this.dataset.metric
      showMetricDetails(metric)
    })
  })
}

// ============================================================================
// FORM HANDLING
// ============================================================================

/**
 * Handle form submission for adding new health metrics
 * Validates input, creates new entry, and updates displays
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
  e.preventDefault()
  console.log(" Processing new health metric submission...")

  try {
    // Get form values
    const metricType = document.getElementById("metricType").value
    const date = document.getElementById("metricDate").value
    const time = document.getElementById("metricTime").value
    const notes = document.getElementById("notes").value

    // Validate required fields
    if (!metricType || !date || !time) {
      showBootstrapAlert("Please fill in all required fields", "danger")
      return
    }

    // Get metric value based on type
    let value
    if (metricType === "bloodPressure") {
      const systolic = document.getElementById("systolic").value
      const diastolic = document.getElementById("diastolic").value

      if (!systolic || !diastolic) {
        showBootstrapAlert("Please enter both systolic and diastolic values", "danger")
        return
      }

      value = `${systolic}/${diastolic}`
    } else {
      const metricValue = document.getElementById("metricValue").value
      if (!metricValue) {
        showBootstrapAlert("Please enter a metric value", "danger")
        return
      }
      value = Number.parseFloat(metricValue)
    }

    // Create new entry
    const newEntry = {
      id: Date.now() + Math.random(),
      type: metricType,
      value: value,
      date: date,
      time: time,
      notes: notes,
      timestamp: new Date(`${date}T${time}`).getTime(),
    }

    // Add to data array
    healthData.push(newEntry)
    saveData()

    // Reset form
    resetForm()

    // Show success message
    showBootstrapAlert("Health metric added successfully!", "success")

    // Redirect to dashboard after successful submission
    setTimeout(() => {
      window.location.href = "main-page.html"
    }, 1000) // Give time for alert to be seen

    console.log("New health metric added:", newEntry)
  } catch (error) {
    console.error("Error adding health metric:", error)
    showBootstrapAlert("Error adding health metric. Please try again.", "danger")
  }
}

/**
 * Handle metric type selection change
 * Shows/hides appropriate input fields based on selected metric type
 */
function handleMetricTypeChange() {
  const metricType = document.getElementById("metricType").value
  const valueGroup = document.getElementById("valueGroup")
  const bloodPressureGroup = document.getElementById("bloodPressureGroup")

  if (metricType === "bloodPressure") {
    valueGroup.style.display = "none"
    bloodPressureGroup.style.display = "grid"
  } else {
    valueGroup.style.display = "block"
    bloodPressureGroup.style.display = "none"
  }

  // Update input placeholder and constraints based on metric type
  const metricValueInput = document.getElementById("metricValue")
  if (metricValueInput && METRIC_TYPES[metricType]) {
    const config = METRIC_TYPES[metricType]
    metricValueInput.placeholder = `Enter ${config.name.toLowerCase()} in ${config.unit}`

    // Set appropriate min/max values
    if (config.normalRange && config.normalRange.min !== undefined) {
      metricValueInput.min = config.normalRange.min * 0.5
      metricValueInput.max = config.normalRange.max * 1.5
    }
  }
}

/**
 * Reset the health metric form to default values
 */
function resetForm() {
  const healthForm = document.getElementById("healthForm")
  if (healthForm) {
    healthForm.reset()
    setDefaultFormValues()

    // Reset visibility of form groups
    document.getElementById("valueGroup").style.display = "block"
    document.getElementById("bloodPressureGroup").style.display = "none"
  }
}

/**
 * Set default date and time values for the form
 */
function setDefaultFormValues() {
  const now = new Date()
  const dateInput = document.getElementById("metricDate")
  const timeInput = document.getElementById("metricTime")

  if (dateInput) {
    dateInput.value = now.toISOString().split("T")[0]
  }

  if (timeInput) {
    timeInput.value = now.toTimeString().slice(0, 5)
  }
}

// ============================================================================
// DASHBOARD UPDATE FUNCTIONS
// ============================================================================

/**
 * Update the main dashboard with latest health metrics
 * Refreshes metric cards, trends, and mini charts
 */
function updateDashboard() {
  console.log("📊 Updating dashboard...")

  // Update all metric cards
  const metricCards = document.querySelectorAll(".metric-card")
  metricCards.forEach((card) => {
    const metricType = card.dataset.metric
    if (metricType) {
      updateMetricCard(metricType, card)
    }
  })

  updateMiniCharts()
}

/**
 * Update individual metric card with latest data
 * @param {string} metric - The metric type to update
 * @param {HTMLElement} card - The metric card element
 */
function updateMetricCard(metric, card) {
  const latestEntry = getLatestEntry(metric)
  const valueElement = card.querySelector(".metric-value")
  const dateElement = card.querySelector(".last-updated")
  const trendElement = card.querySelector(".metric-trend")

  if (!valueElement) return

  if (latestEntry) {
    const config = METRIC_TYPES[metric]
    const displayValue = latestEntry.value
    const unit = config ? config.unit : ""

    // Update value display
    valueElement.textContent = `${displayValue} ${unit}`

    // Update last updated date
    if (dateElement) {
      const lastDate = new Date(latestEntry.timestamp).toLocaleDateString()
      dateElement.textContent = `Last: ${lastDate}`
    }

    // Calculate and display trend
    if (trendElement) {
      const trend = calculateTrend(metric)
      if (trend) {
        trendElement.textContent = trend.text
        trendElement.className = `metric-trend ${trend.class}`
      } else {
        trendElement.textContent = "New"
        trendElement.className = "metric-trend trend-stable"
      }
    }

    // Add pulse animation for recent entries (within last 24 hours)
    const isRecent = Date.now() - latestEntry.timestamp < 24 * 60 * 60 * 1000
    if (isRecent) {
      card.classList.add("recent-update")
      setTimeout(() => card.classList.remove("recent-update"), 3000)
    }
  } else {
    // No data available
    const unit = METRIC_TYPES[metric] ? METRIC_TYPES[metric].unit : ""
    valueElement.textContent = `-- ${unit}`

    if (dateElement) {
      dateElement.textContent = "No data"
    }

    if (trendElement) {
      trendElement.textContent = ""
      trendElement.className = "metric-trend"
    }
  }
}

// ============================================================================
// DATA UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the most recent entry for a specific metric type
 * @param {string} type - The metric type to search for
 * @returns {Object|null} The latest entry or null if none found
 */
function getLatestEntry(type) {
  return healthData.filter((entry) => entry.type === type).sort((a, b) => b.timestamp - a.timestamp)[0] || null
}

/**
 * Get entries for a specific metric type within a date range
 * @param {string} type - The metric type
 * @param {number} days - Number of days to look back
 * @returns {Array} Array of entries within the specified range
 */
function getEntriesInRange(type, days = 30) {
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
  return healthData
    .filter((entry) => entry.type === type && entry.timestamp >= cutoffTime)
    .sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Calculate trend between the two most recent entries
 * @param {string} type - The metric type
 * @returns {Object|null} Trend object with text and class, or null
 */
function calculateTrend(type) {
  const entries = healthData
    .filter((entry) => entry.type === type)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 2)

  if (entries.length < 2) return null

  // Handle blood pressure separately
  if (type === "bloodPressure") {
    const current = entries[0].value.split("/").map(Number)
    const previous = entries[1].value.split("/").map(Number)

    const currentAvg = (current[0] + current[1]) / 2
    const previousAvg = (previous[0] + previous[1]) / 2

    const difference = currentAvg - previousAvg
    const percentChange = ((difference / previousAvg) * 100).toFixed(1)

    if (Math.abs(difference) < 2) {
      return { text: "Stable", class: "trend-stable" }
    } else if (difference > 0) {
      return { text: `↑ ${Math.abs(percentChange)}%`, class: "trend-up" }
    } else {
      return { text: `↓ ${Math.abs(percentChange)}%`, class: "trend-down" }
    }
  }

  // Handle numeric values
  const current = Number.parseFloat(entries[0].value)
  const previous = Number.parseFloat(entries[1].value)

  if (isNaN(current) || isNaN(previous)) return null

  const difference = current - previous
  const percentChange = ((difference / previous) * 100).toFixed(1)

  // Determine stability threshold based on metric type
  let stabilityThreshold = 0.1
  if (type === "weight") stabilityThreshold = 0.2
  if (type === "heartRate") stabilityThreshold = 2
  if (type === "bloodSugar") stabilityThreshold = 5
  if (type === "steps") stabilityThreshold = 500
  if (type === "height") stabilityThreshold = 0.5

  if (Math.abs(difference) < stabilityThreshold) {
    return { text: "Stable", class: "trend-stable" }
  } else if (difference > 0) {
    return { text: `↑ ${Math.abs(percentChange)}%`, class: "trend-up" }
  } else {
    return { text: `↓ ${Math.abs(percentChange)}%`, class: "trend-down" }
  }
}

/**
 * Save health data and goals to localStorage
 */
function saveData() {
  try {
    localStorage.setItem("healthData", JSON.stringify(healthData))
    localStorage.setItem("healthGoals", JSON.stringify(goals))
    console.log("💾 Data saved to localStorage")
  } catch (error) {
    console.error("❌ Error saving data:", error)
    showBootstrapAlert("Error saving data", "danger")
  }
}

// ============================================================================
// CHART FUNCTIONALITY
// ============================================================================

/**
 * Initialize main dashboard charts
 * Creates weight and heart rate trend charts
 */

/**
 * Create a Chart.js chart instance
 * @param {HTMLCanvasElement} ctx - Canvas context
 * @param {string} type - Metric type
 * @param {string} chartType - Chart type ('line' or 'bar')
 * @returns {Chart} Chart.js instance
 */

/**
 * Update all main charts with latest data
 */

/**
 * Update a specific chart with data
 * @param {Chart} chart - Chart.js instance
 * @param {string} type - Metric type
 */

/**
 * Toggle between line and bar chart types
 */

// ============================================================================
// MINI CHARTS FOR METRIC CARDS
// ============================================================================

/**
 * Initialize mini charts for all metric cards
 */
function initializeMiniCharts() {
  console.log("📊 Initializing mini charts...")

  const metricCards = document.querySelectorAll(".metric-card")
  metricCards.forEach((card) => {
    const metricType = card.dataset.metric
    if (metricType) {
      updateMiniChart(metricType)
    }
  })
}

/**
 * Update mini chart for a specific metric
 * @param {string} type - Metric type
 */
function updateMiniChart(type) {
  const canvas = document.getElementById(`${type}MiniChart`)
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  const entries = getEntriesInRange(type, 7) // Last 7 days

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (entries.length === 0) {
    // Draw empty state
    ctx.fillStyle = "#e9ecef"
    for (let i = 0; i < 7; i++) {
      const barWidth = canvas.width / 7
      const x = i * barWidth + 2
      const height = 5
      ctx.fillRect(x, canvas.height - height, barWidth - 4, height)
    }
    return
  }

  // Prepare data
  let data
  if (type === "bloodPressure") {
    data = entries.map((entry) => {
      const values = entry.value.split("/")
      return Number.parseInt(values[0]) // Use systolic
    })
  } else {
    data = entries.map((entry) => Number.parseFloat(entry.value))
  }

  // Calculate chart dimensions
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const barWidth = canvas.width / Math.max(data.length, 7)

  // Draw bars
  const config = METRIC_TYPES[type]
  ctx.fillStyle = config ? config.color : "#27ae60"

  data.forEach((value, index) => {
    const normalizedHeight = ((value - min) / range) * (canvas.height - 10) + 5
    const x = index * barWidth + 2
    const y = canvas.height - normalizedHeight

    ctx.fillRect(x, y, barWidth - 4, normalizedHeight)
  })
}

/**
 * Update all mini charts
 */
function updateMiniCharts() {
  const metricCards = document.querySelectorAll(".metric-card")
  metricCards.forEach((card) => {
    const metricType = card.dataset.metric
    if (metricType) {
      updateMiniChart(metricType)
    }
  })
}

// // ============================================================================
// // HISTORY MANAGEMENT
// // ============================================================================

// /**
//  * Update the history view with filtered health records
//  */
// function updateHistory() {
//   console.log("📋 Updating history...")

//   const filter = document.getElementById("historyFilter")?.value || "all"
//   const historyList = document.getElementById("historyList")

//   if (!historyList) return

//   // Filter data based on selection
//   let filteredData = healthData
//   if (filter !== "all") {
//     filteredData = healthData.filter((entry) => entry.type === filter)
//   }

//   // Sort by timestamp (newest first)
//   filteredData.sort((a, b) => b.timestamp - a.timestamp)

//   // Update header with count
//   const historyHeader = document.querySelector(".history-header h2")
//   if (historyHeader) {
//     const totalCount = filteredData.length
//     historyHeader.textContent = `Health History (${totalCount} ${totalCount === 1 ? "record" : "records"})`
//   }

//   // Handle empty state
//   if (filteredData.length === 0) {
//     historyList.innerHTML = `
//       <div class="empty-state text-center py-5">
//         <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
//         <h5 class="text-muted">No health records found</h5>
//         <p class="text-muted">Start tracking your health metrics to see them here</p>
//         <a href="add-dailylog.html" class="btn btn-primary">
//           <i class="fas fa-plus me-2"></i>Add First Entry
//         </a>
//       </div>
//     `
//     return
//   }

//   // Limit display for performance (show max 100 items)
//   const displayData = filteredData.slice(0, 100)

//   // Generate history HTML with Bootstrap cards
//   historyList.innerHTML = displayData
//     .map((entry) => {
//       const config = METRIC_TYPES[entry.type]
//       const displayName = config ? config.name : entry.type
//       const unit = config ? config.unit : ""
//       const date = new Date(entry.timestamp)
//       const icon = config ? config.icon : "fas fa-chart-line"
//       const color = config ? config.color : "#6c757d"

//       return `
//         <div class="card mb-3 history-item" data-id="${entry.id}">
//           <div class="card-body">
//             <div class="row align-items-center">
//               <div class="col-auto">
//                 <div class="metric-icon-small" style="background-color: ${color}20; color: ${color};">
//                   <i class="${icon}"></i>
//                 </div>
//               </div>
//               <div class="col">
//                 <h6 class="card-title mb-1">${displayName}</h6>
//                 <p class="card-text text-muted mb-1">
//                   <small>${date.toLocaleDateString()} at ${entry.time}</small>
//                 </p>
//                 ${entry.notes ? `<p class="card-text"><small class="text-muted fst-italic">${entry.notes}</small></p>` : ""}
//               </div>
//               <div class="col-auto">
//                 <span class="badge bg-primary fs-6">${entry.value} ${unit}</span>
//               </div>
//               <div class="col-auto">
//                 <button class="btn btn-outline-danger btn-sm" onclick="deleteEntry(${entry.id})" title="Delete entry">
//                   <i class="fas fa-trash"></i>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       `
//     })
//     .join("")

//   // Show pagination info if needed
//   if (filteredData.length > 100) {
//     historyList.innerHTML += `
//       <div class="alert alert-info text-center">
//         <i class="fas fa-info-circle me-2"></i>
//         Showing latest 100 records out of ${filteredData.length} total records
//       </div>
//     `
//   }
// }

// /**
//  * Delete a specific health entry
//  * @param {number} id - Entry ID to delete
//  */
// function deleteEntry(id) {
//   // Show Bootstrap confirmation modal
//   const modalHtml = `
//     <div class="modal fade" id="deleteModal" tabindex="-1">
//       <div class="modal-dialog">
//         <div class="modal-content">
//           <div class="modal-header">
//             <h5 class="modal-title">Confirm Delete</h5>
//             <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
//           </div>
//           <div class="modal-body">
//             Are you sure you want to delete this health entry? This action cannot be undone.
//           </div>
//           <div class="modal-footer">
//             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
//             <button type="button" class="btn btn-danger" onclick="confirmDelete(${id})" data-bs-dismiss="modal">Delete</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   `

//   // Add modal to page if not exists
//   if (!document.getElementById("deleteModal")) {
//     document.body.insertAdjacentHTML("beforeend", modalHtml)
//   }

//   // Show modal
//   const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
//   modal.show()
// }

// /**
//  * Confirm and execute entry deletion
//  * @param {number} id - Entry ID to delete
//  */
// function confirmDelete(id) {
//   console.log(`🗑️ Deleting entry with ID: ${id}`)

//   // Remove entry from data array
//   const initialLength = healthData.length
//   healthData = healthData.filter((entry) => entry.id !== id)

//   if (healthData.length < initialLength) {
//     saveData()
//     // Update only the relevant view
//     const path = window.location.pathname
//     if (path.includes("main-page.html") || path === "/") {
//       updateDashboard()
//     } else if (path.includes("history.html")) {
//       updateHistory()
//     }
//     updateMiniCharts() // Mini charts are on dashboard, but good to keep this
//     showBootstrapAlert("Entry deleted successfully!", "success")
//   } else {
//     showBootstrapAlert("Entry not found", "danger")
//   }
// }

// /**
//  * Clear all health history data
//  */
// function clearHistory() {
//   // Show Bootstrap confirmation modal
//   const modalHtml = `
//     <div class="modal fade" id="clearHistoryModal" tabindex="-1">
//       <div class="modal-dialog">
//         <div class="modal-content">
//           <div class="modal-header">
//             <h5 class="modal-title">Clear All History</h5>
//             <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
//           </div>
//           <div class="modal-body">
//             <div class="alert alert-warning">
//               <i class="fas fa-exclamation-triangle me-2"></i>
//               <strong>Warning!</strong> This will permanently delete all your health records. This action cannot be undone.
//             </div>
//             Are you sure you want to continue?
//           </div>
//           <div class="modal-footer">
//             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
//             <button type="button" class="btn btn-danger" onclick="confirmClearHistory()" data-bs-dismiss="modal">Clear All</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   `

//   // Add modal to page if not exists
//   if (!document.getElementById("clearHistoryModal")) {
//     document.body.insertAdjacentHTML("beforeend", modalHtml)
//   }

//   // Show modal
//   const modal = new bootstrap.Modal(document.getElementById("clearHistoryModal"))
//   modal.show()
// }

// /**
//  * Confirm and execute history clearing
//  */
// function confirmClearHistory() {
//   console.log("🗑️ Clearing all health history...")

//   healthData = []
//   saveData()

//   // Update all displays
//   updateDashboard() // Update dashboard if user navigates back
//   updateHistory() // Update current history page
//   updateMiniCharts()

//   showBootstrapAlert("History cleared successfully!", "success")
// }

// ============================================================================
// GOALS MANAGEMENT
// ============================================================================

/**
 * Set a health goal for a specific metric
 * @param {string} type - Metric type
 */
// function setGoal(type) {
//   console.log(`🎯 Setting goal for ${type}...`)

//   let goalValue

//   if (type === "bloodPressure") {
//     const systolic = document.getElementById("systolicGoal")?.value
//     const diastolic = document.getElementById("diastolicGoal")?.value

//     if (!systolic || !diastolic) {
//       showBootstrapAlert("Please enter both systolic and diastolic values", "warning")
//       return
//     }

//     goalValue = `${systolic}/${diastolic}`
//   } else {
//     const input = document.getElementById(`${type}Goal`)
//     if (!input || !input.value) {
//       showBootstrapAlert("Please enter a valid goal value", "warning")
//       return
//     }

//     goalValue = Number.parseFloat(input.value)
//     if (isNaN(goalValue)) {
//       showBootstrapAlert("Please enter a valid numeric value", "warning")
//       return
//     }
//   }

//   // Save goal
//   goals[type] = goalValue
//   saveData()
//   updateGoals()

//   showBootstrapAlert("Goal set successfully!", "success")

//   // Redirect to view-targets.html after successful goal setting
//   setTimeout(() => {
//     window.location.href = "my-targets.html"
//   }, 1000) // Give time for alert to be seen
// }

// /**
//  * Update the goals view with current progress
//  */
// function updateGoals() {
//   console.log("🎯 Updating goals...")

//   const goalTypes = ["weight", "heartRate", "bloodPressure", "sleep"]

//   goalTypes.forEach((type) => {
//     updateGoalStatus(type)
//   })
// }


// /**
//  * Update goal status for a specific metric type
//  * @param {string} type - Metric type
//  */
// function updateGoalStatus(type) {
//   const statusElement = document.getElementById(`${type}GoalStatus`)
//   if (!statusElement) return

//   const goal = goals[type]

//   if (!goal) {
//     statusElement.innerHTML = `
//       <div class="alert alert-light text-center">
//         <i class="fas fa-target text-muted"></i>
//         <p class="mb-0 text-muted">No goal set</p>
//       </div>
//     `
//     return
//   }

//   const latestEntry = getLatestEntry(type)
//   if (!latestEntry) {
//     statusElement.innerHTML = `
//       <div class="alert alert-light text-center">
//         <i class="fas fa-chart-line text-muted"></i>
//         <p class="mb-0 text-muted">No data available</p>
//       </div>
//     `
//     return
//   }

//   let achieved = false
//   let statusText = ""
//   let progressPercentage = 0

//   if (type === "bloodPressure") {
//     // Handle blood pressure goals
//     const [goalSys, goalDia] = goal.split("/").map(Number)
//     const [currentSys, currentDia] = latestEntry.value.split("/").map(Number)

//     achieved = currentSys <= goalSys && currentDia <= goalDia
//     statusText = achieved ? "Goal achieved!" : `Current: ${latestEntry.value}, Target: ${goal}`

//     // Calculate progress based on how close to target
//     const sysProgress = Math.max(0, 100 - Math.abs(currentSys - goalSys))
//     const diaProgress = Math.max(0, 100 - Math.abs(currentDia - goalDia))
//     progressPercentage = (sysProgress + diaProgress) / 2
//   } else {
//     // Handle numeric goals
//     const current = Number.parseFloat(latestEntry.value)
//     const target = Number.parseFloat(goal)
//     const difference = Math.abs(current - target)
//     const tolerance = target * 0.05 // 5% tolerance

//     achieved = difference <= tolerance
//     statusText = achieved ? "Goal achieved!" : `Current: ${current}, Target: ${target}`

//     // Calculate progress percentage
//     const maxDifference = target * 0.2 // 20% is considered 0% progress
//     progressPercentage = Math.max(0, 100 - (difference / maxDifference) * 100)
//   }

//   // Create Bootstrap progress bar and alert
//   const alertClass = achieved ? "alert-success" : "alert-info"
//   const progressBarClass = achieved ? "bg-success" : "bg-primary"
//   const icon = achieved ? "fas fa-check-circle" : "fas fa-target"

//   statusElement.innerHTML = `
//     <div class="alert ${alertClass}">
//       <div class="d-flex align-items-center mb-2">
//         <i class="${icon} me-2"></i>
//         <span>${statusText}</span>
//       </div>
//       ${
//         !achieved
//           ? `
//         <div class="progress mb-2" style="height: 8px;">
//           <div class="progress-bar ${progressBarClass}" role="progressbar" 
//                style="width: ${Math.min(100, progressPercentage)}%" 
//                aria-valuenow="${Math.round(progressPercentage)}" 
//                aria-valuemin="0" aria-valuemax="100">
//           </div>
//         </div>
//         <small class="text-muted">${Math.round(progressPercentage)}% to goal</small>
//       `
//           : ""
//       }
//     </div>
//   `
// }

function handleGoalFormSubmit(event) {
  event.preventDefault();

  const metricType = document.getElementById("goalMetricType").value;
  const comparison = document.getElementById("comparisonType").value;
  const stats = document.getElementById("statisticsType").value;
  const targetDate = document.getElementById("targetDate").value;
  const notes = document.getElementById("goalNotes").value;

  let target = {
    metricType,
    comparison,
    stats,
    targetDate,
    notes,
    createdAt: new Date().toISOString(),
  };

  if (metricType === "bloodPressure") {
    const sys = parseInt(document.getElementById("goalSystolic").value);
    const dia = parseInt(document.getElementById("goalDiastolic").value);
    if (!isNaN(sys) && !isNaN(dia)) {
      target.value = `${sys}/${dia}`;
    } else {
      alert("Please enter valid systolic and diastolic values.");
      return;
    }
  } else if (comparison === "range") {
    const min = parseFloat(document.getElementById("rangeMin").value);
    const max = parseFloat(document.getElementById("rangeMax").value);
    if (!isNaN(min) && !isNaN(max)) {
      target.value = `${min} - ${max}`;
    } else {
      alert("Please enter valid minimum and maximum values.");
      return;
    }
  } else {
    const value = parseFloat(document.getElementById("goalValue").value);
    if (!isNaN(value)) {
      target.value = value;
    } else {
      alert("Please enter a valid goal value.");
      return;
    }
  }

  // Load and validate existing data
  let existing = [];
  try {
    const stored = JSON.parse(localStorage.getItem("healthGoals"));
    if (Array.isArray(stored)) {
      existing = stored;
    }
  } catch (e) {
    console.warn("Corrupt localStorage data for healthGoals, resetting...");
  }

  // Save
  existing.push(target);
  localStorage.setItem("healthGoals", JSON.stringify(existing));

  alert("🎯 Goal saved successfully!");
  event.target.reset(); // Reset the form
}




// ============================================================================
// METRIC DETAILS MODAL
// ============================================================================

/**
 * Show detailed view for a specific metric
 * @param {string} metric - Metric type
 */
function showMetricDetails(metric) {
  const config = METRIC_TYPES[metric]
  if (!config) return

  const entries = getEntriesInRange(metric, 30)
  const latestEntry = getLatestEntry(metric)

  let statsHtml = ""
  if (entries.length > 0) {
    if (metric === "bloodPressure") {
      const systolicValues = entries.map((e) => Number.parseInt(e.value.split("/")[0]))
      const diastolicValues = entries.map((e) => Number.parseInt(e.value.split("/")[1]))

      statsHtml = `
        <div class="row text-center">
          <div class="col-6">
            <h6>Systolic</h6>
            <p class="mb-1"><strong>Avg:</strong> ${(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length).toFixed(1)}</p>
            <p class="mb-1"><strong>Range:</strong> ${Math.min(...systolicValues)} - ${Math.max(...systolicValues)}</p>
          </div>
          <div class="col-6">
            <h6>Diastolic</h6>
            <p class="mb-1"><strong>Avg:</strong> ${(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length).toFixed(1)}</p>
            <p class="mb-1"><strong>Range:</strong> ${Math.min(...diastolicValues)} - ${Math.max(...diastolicValues)}</p>
          </div>
        </div>
      `
    } else {
      const values = entries.map((e) => Number.parseFloat(e.value))
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      const min = Math.min(...values).toFixed(1)
      const max = Math.max(...values).toFixed(1)

      statsHtml = `
        <div class="row text-center">
          <div class="col-4">
            <h6>Average</h6>
            <p class="mb-0"><strong>${avg} ${config.unit}</strong></p>
          </div>
          <div class="col-4">
            <h6>Minimum</h6>
            <p class="mb-0"><strong>${min} ${config.unit}</strong></p>
          </div>
          <div class="col-4">
            <h6>Maximum</h6>
            <p class="mb-0"><strong>${max} ${config.unit}</strong></p>
          </div>
        </div>
      `
    }
  }

  const modalHtml = `
    <div class="modal fade" id="metricDetailModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header" style="background-color: ${config.color}20;">
            <h5 class="modal-title">
              <i class="${config.icon} me-2" style="color: ${config.color};"></i>
              ${config.name} Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${
              latestEntry
                ? `
              <div class="alert alert-primary">
                <h6>Latest Reading</h6>
                <p class="mb-1"><strong>${latestEntry.value} ${config.unit}</strong></p>
                <small class="text-muted">Recorded on ${new Date(latestEntry.timestamp).toLocaleDateString()} at ${latestEntry.time}</small>
                ${latestEntry.notes ? `<br><small class="fst-italic">"${latestEntry.notes}"</small>` : ""}
              </div>
            `
                : '<div class="alert alert-warning">No data recorded yet</div>'
            }
            
            ${
              entries.length > 0
                ? `
              <h6>30-Day Statistics</h6>
              ${statsHtml}
              <hr>
              <p><strong>Total Entries:</strong> ${entries.length}</p>
            `
                : ""
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <a href="add-dailylog.html" class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>Add Entry
            </a>
          </div>
        </div>
      </div>
    </div>
  `

  // Remove existing modal if any
  const existingModal = document.getElementById("metricDetailModal")
  if (existingModal) {
    existingModal.remove()
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("metricDetailModal"))
  modal.show()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a date for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format a time for display
 * @param {string} time - Time string (HH:MM format)
 * @returns {string} Formatted time string
 */
function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const hour12 = hours % 12 || 12
  const ampm = hours >= 12 ? "PM" : "AM"
  return `${hour12}:${minutes} ${ampm}`
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ============================================================================
// WINDOW RESIZE HANDLER
// ============================================================================

/**
 * Handle window resize events
 * Ensures charts are properly resized
 */
function handleResize() {
  // Update mini charts
  updateMiniCharts()
}

// Add debounced resize listener
window.addEventListener("resize", debounce(handleResize, 250))

// ============================================================================
// FOOTER ACTIONS - 3 DEMO BUTTONS
// ============================================================================

/**
 * Generate a comprehensive health report
 */
function generateReport() {
  console.log("📄 Generating health report...")

  if (healthData.length === 0) {
    showBootstrapAlert("No health data available to generate report", "warning")
    return
  }

  // Calculate report statistics
  const reportData = {
    totalEntries: healthData.length,
    dateRange: {
      start: new Date(Math.min(...healthData.map((e) => e.timestamp))).toLocaleDateString(),
      end: new Date(Math.max(...healthData.map((e) => e.timestamp))).toLocaleDateString(),
    },
    metrics: {},
  }

  // Calculate statistics for each metric type
  Object.keys(METRIC_TYPES).forEach((type) => {
    const entries = healthData.filter((e) => e.type === type)
    if (entries.length > 0) {
      const config = METRIC_TYPES[type]

      if (type === "bloodPressure") {
        const systolicValues = entries.map((e) => Number.parseInt(e.value.split("/")[0]))
        const diastolicValues = entries.map((e) => Number.parseInt(e.value.split("/")[1]))

        reportData.metrics[type] = {
          name: config.name,
          count: entries.length,
          latest: entries[entries.length - 1].value,
          avgSystolic: (systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length).toFixed(1),
          avgDiastolic: (diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length).toFixed(1),
        }
      } else {
        const values = entries.map((e) => Number.parseFloat(e.value))
        reportData.metrics[type] = {
          name: config.name,
          unit: config.unit,
          count: entries.length,
          latest: values[values.length - 1],
          average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
          min: Math.min(...values).toFixed(1),
          max: Math.max(...values).toFixed(1),
        }
      }
    }
  })

  // Create report HTML
  let reportHtml = `
    <div class="container mt-4">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h2 class="mb-0"><i class="fas fa-file-alt me-2"></i>Health Report</h2>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-6">
              <p><strong>Report Period:</strong> ${reportData.dateRange.start} - ${reportData.dateRange.end}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Total Entries:</strong> ${reportData.totalEntries}</p>
            </div>
          </div>
  `

  Object.entries(reportData.metrics).forEach(([type, data]) => {
    reportHtml += `
      <div class="card mb-3">
        <div class="card-header">
          <h5 class="mb-0">${data.name}</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <p><strong>Entries:</strong> ${data.count}</p>
            </div>
            <div class="col-md-3">
              <p><strong>Latest:</strong> ${data.latest} ${data.unit || ""}</p>
            </div>
    `

    if (type === "bloodPressure") {
      reportHtml += `
            <div class="col-md-6">
              <p><strong>Average:</strong> ${data.avgSystolic}/${data.avgDiastolic} mmHg</p>
            </div>
      `
    } else {
      reportHtml += `
            <div class="col-md-3">
              <p><strong>Average:</strong> ${data.average} ${data.unit}</p>
            </div>
            <div class="col-md-3">
              <p><strong>Range:</strong> ${data.min} - ${data.max} ${data.unit}</p>
            </div>
      `
    }

    reportHtml += `
          </div>
        </div>
      </div>
    `
  })

  reportHtml += `
        </div>
      </div>
    </div>
  `

  // Open report in new window
  const reportWindow = window.open("", "_blank")
  reportWindow.document.write(`
    <html>
      <head>
        <title>Health Report</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body>
        ${reportHtml}
        <div class="text-center mt-4 mb-4">
          <button class="btn btn-primary" onclick="window.print()">
            <i class="fas fa-print me-2"></i>Print Report
          </button>
        </div>
      </body>
    </html>
  `)

  showBootstrapAlert("Health report generated successfully!", "success")
}

/**
 * Export health data as JSON file
 */
function exportData() {
  console.log("💾 Exporting health data...")

  if (healthData.length === 0) {
    showBootstrapAlert("No health data to export", "warning")
    return
  }

  try {
    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: healthData.length,
      goals: goals,
      healthData: healthData,
    }

    // Create and download file
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `health-data-${new Date().toISOString().split("T")[0]}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showBootstrapAlert("Health data exported successfully!", "success")
  } catch (error) {
    console.error("❌ Error exporting data:", error)
    showBootstrapAlert("Error exporting data", "danger")
  }
}

/**
 * Reset all application data
 */
function resetAllData() {
  // Show Bootstrap confirmation modal
  const modalHtml = `
    <div class="modal fade" id="resetDataModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="fas fa-exclamation-triangle me-2"></i>Reset All Data
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Warning!</strong> This will permanently delete all your health records and goals. This action cannot be undone.
            </div>
            <p>Are you sure you want to reset all data? New demo data will be generated.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="confirmResetData()" data-bs-dismiss="modal">
              <i class="fas fa-trash me-2"></i>Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  // Add modal to page if not exists
  if (!document.getElementById("resetDataModal")) {
    document.body.insertAdjacentHTML("beforeend", modalHtml)
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("resetDataModal"))
  modal.show()
}

/**
 * Confirm and execute data reset
 */
function confirmResetData() {
  console.log("🔄 Resetting all application data...")

  // Clear all data
  healthData = []
  goals = {}

  // Clear localStorage
  localStorage.removeItem("healthData")
  localStorage.removeItem("healthGoals")

  // Generate new mock data
  initializeMockData()

  // Update all displays based on current page
  const path = window.location.pathname
  if (path.includes("main-page.html") || path === "/") {
    updateDashboard()
    updateMiniCharts()
  } else if (path.includes("my-dailylogs.html")) {
    updateHistory()
  } else if (path.includes("add-target.html") || path.includes("my-targets.html")) {
    updateGoals()
  }

  showBootstrapAlert("All data has been reset and new demo data generated!", "success")
}

// Make functions available globally for HTML onclick handlers
window.showDashboard = showDashboard
window.showAddMetric = showAddMetric
window.showHistory = showHistory
window.showGoals = showGoals
window.showMetricDetails = showMetricDetails
window.generateReport = generateReport
window.exportData = exportData
window.resetAllData = resetAllData
window.confirmResetData = confirmResetData
