// Jekyll Forge Landing Page - Interactive Features

document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeScrollAnimations();
  initializeInteractiveElements();
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

/**
 * Initialize scroll-based animations
 */
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document
    .querySelectorAll(".feature-card, .step, .pricing-card")
    .forEach(element => {
      element.style.opacity = "0";
      element.style.transform = "translateY(20px)";
      element.style.transition =
        "opacity 0.6s ease-out, transform 0.6s ease-out";
      observer.observe(element);
    });
}

/**
 * Initialize interactive elements
 */
function initializeInteractiveElements() {
  // Add smooth hover effects to buttons
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(button => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Add click feedback to feature cards
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach(card => {
    card.addEventListener("click", function () {
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "";
      }, 100);
    });
  });

  // Track scroll position for navbar styling
  trackScrollPosition();
}

/**
 * Track scroll position and update navbar styling
 */
function trackScrollPosition() {
  const navbar = document.querySelector(".navbar");
  let lastScrollTop = 0;

  window.addEventListener(
    "scroll",
    () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Add shadow when scrolled
      if (scrollTop > 10) {
        navbar.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      } else {
        navbar.style.boxShadow = "none";
      }

      lastScrollTop = scrollTop;
    },
    false
  );
}

/**
 * Utility: Smooth scroll to element
 */
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Utility: Debounce function for performance
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions for external use
window.jekyllForge = {
  smoothScrollTo,
};
