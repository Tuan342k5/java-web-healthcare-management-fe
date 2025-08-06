// ============================================================================
// NAVIGATION AND VIEW MANAGEMENT (Simplified for multi-page)
// ============================================================================

// These functions now simply redirect to the respective HTML pages
function showDashboard() {
  window.location.href = "main-page.html"
}



function showHistory() {
  window.location.href = "my-dailylogs.html"
}

function showGoals() {
  window.location.href = "my-targets.html"
}




// Make functions available globally for HTML onclick handlers
window.showDashboard = showDashboard
window.showHistory = showHistory
window.showGoals = showGoals