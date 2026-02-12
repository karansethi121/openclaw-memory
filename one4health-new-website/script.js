// One4Health Website JavaScript

// ========================================
// Navigation
// ========================================
const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

// Scroll effect for navbar
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ========================================
// FAQ Accordion
// ========================================
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });

    // Open clicked FAQ if it wasn't active
    if (!isActive) {
      faqItem.classList.add('active');
    }
  });
});

// ========================================
// Contact Form
// ========================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Simple validation
    if (name && email && message) {
      // Show success message
      alert('Thank you for your message! We\'ll get back to you soon.');
      contactForm.reset();
    } else {
      alert('Please fill in all required fields.');
    }
  });
}

// ========================================
// Newsletter Form
// ========================================
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('newsletterEmail').value;
    
    if (email) {
      // Show success message
      alert('Thank you for subscribing to our newsletter!');
      newsletterForm.reset();
    }
  });
}

// ========================================
// Product Buttons
// ========================================
document.querySelectorAll('.product-btn').forEach(button => {
  button.addEventListener('click', () => {
    alert('Adding to cart functionality will be implemented soon!');
  });
});

// ========================================
// Intersection Observer for Animations
// ========================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('aos-animate');
    }
  });
}, observerOptions);

// Observe all elements with data-aos attribute
document.querySelectorAll('[data-aos]').forEach(el => {
  observer.observe(el);
});

// ========================================
// Lazy Load Images
// ========================================
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));

// ========================================
// Scroll Progress Bar
// ========================================
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress-bar';
progressBar.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: #10B981;
  z-index: 9999;
  transition: width 0.1s ease;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPercent + '%';
});

// ========================================
// Back to Top Button
// ========================================
const backToTopBtn = document.createElement('button');
backToTopBtn.className = 'back-to-top';
backToTopBtn.innerHTML = '↑';
backToTopBtn.style.cssText = `
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #10B981;
  color: white;
  font-size: 24px;
  border: none;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;
document.body.appendChild(backToTopBtn);

// Show/hide back to top button
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTopBtn.style.opacity = '1';
    backToTopBtn.style.visibility = 'visible';
  } else {
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.visibility = 'hidden';
  }
});

// Scroll to top on click
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// ========================================
// Testimonial Carousel
// ========================================
const testimonialCards = document.querySelectorAll('.testimonial-card');
let currentTestimonial = 0;

const showTestimonial = (index) => {
  testimonialCards.forEach((card, i) => {
    card.style.display = i === index ? 'block' : 'none';
  });
};

// Auto-rotate testimonials
setInterval(() => {
  currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
  showTestimonial(currentTestimonial);
}, 5000);

// ========================================
// Product Hover Effects
// ========================================
const productCards = document.querySelectorAll('.product-card');

productCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-10px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
  });
});

// ========================================
// Dynamic Year in Footer
// ========================================
const yearElements = document.querySelectorAll('.current-year');
const currentYear = new Date().getFullYear();
yearElements.forEach(el => {
  el.textContent = currentYear;
});

// ========================================
// Hero Animation Delay
// ========================================
window.addEventListener('load', () => {
  const heroGummies = document.querySelectorAll('.hero-gummy');
  heroGummies.forEach((gummy, index) => {
    gummy.style.animationDelay = `${index * 0.5}s`;
  });
});

// ========================================
// Performance: Debounce function
// ========================================
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

// ========================================
// Window Resize Handler
// ========================================
const handleResize = debounce(() => {
  // Close mobile menu on desktop
  if (window.innerWidth > 768) {
    navLinks.classList.remove('active');
  }
}, 250);

window.addEventListener('resize', handleResize);

// ========================================
// Console Welcome Message
// ========================================
console.log('%c Welcome to One4Health! ', 'background: #10B981; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('%c Wellness That Tastes Amazing 🍬 ', 'color: #10B981; font-size: 14px; font-weight: bold;');

// ========================================
// Initialize animations on load
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Trigger initial animations for elements above fold
  document.querySelectorAll('.hero').forEach(el => {
    el.classList.add('aos-animate');
  });
});

// ========================================
// Add to Cart Animation
// ========================================
document.querySelectorAll('.product-btn').forEach(button => {
  button.addEventListener('click', function(e) {
    if (!this.classList.contains('added')) {
      this.innerHTML = '✓ Added';
      this.classList.add('added');
      this.style.background = '#059669';
      
      setTimeout(() => {
        this.innerHTML = 'Add to Cart';
        this.classList.remove('added');
        this.style.background = '';
      }, 2000);
    }
  });
});

// ========================================
// Website Performance Monitoring
// ========================================
window.addEventListener('load', () => {
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;
  
  console.log(`Performance Metrics:`);
  console.log(`Page Load Time: ${pageLoadTime}ms`);
  console.log(`Network Time: ${connectTime}ms`);
  console.log(`Render Time: ${renderTime}ms`);
});