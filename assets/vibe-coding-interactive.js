// Interactive Features JavaScript Bundle

// 1. Ripple Effect for Buttons
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

// 2. Counter Animation
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// 3. Scroll Reveal
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(reveal => {
    const windowHeight = window.innerHeight;
    const elementTop = reveal.getBoundingClientRect().top;
    const elementVisible = 150;

    if (elementTop < windowHeight - elementVisible) {
      reveal.classList.add('active');
    }
  });
}

// 4. Stagger Animation
function staggerAnimate(elements, delay = 100) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('visible');
    }, delay * index);
  });
}

// 5. Magnetic Button Effect
function makeMagnetic(button) {
  const strength = 20;

  button.addEventListener('mousemove', (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0)';
  });
}

// 6. Parallax Effect
function parallaxEffect(elements) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    elements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      element.style.transform = `translateY(${scrollY * speed}px)`;
    });
  });
}

// 7. Glow on Scroll
function glowingOnScroll() {
  const elements = document.querySelectorAll('.glow-effect');
  window.addEventListener('scroll', () => {
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      element.classList.toggle('glowing', isVisible);
    });
  });
}

// 8. Smooth Scroll to Section
function smoothScroll(target) {
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// 9. Typing Effect
function typeText(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// 10. Progress Bar Animation
function animateProgressBar(element, targetPercent, duration = 1000) {
  let start = 0;
  const increment = targetPercent / (duration / 16);
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= targetPercent) {
      element.style.width = `${targetPercent}%`;
      clearInterval(timer);
    } else {
      element.style.width = `${Math.floor(start)}%`;
    }
  }, 16);
}

// 11. Wave Text Effect
function createWaveText(element) {
  const text = element.textContent;
  element.innerHTML = text.split('').map(char => `<span>${char}</span>`).join('');
  element.classList.add('wave-text');
}

// 12. Mouse Trail Effect
function createMouseTrail() {
  const dots = [];
  const maxDots = 20;

  document.addEventListener('mousemove', (e) => {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, #2E7D32, #C9A227);
      border-radius: 50%;
      pointer-events: none;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      z-index: 9999;
      animation: fadeOut 0.5s ease forwards;
    `;

    document.body.appendChild(dot);
    dots.push(dot);

    if (dots.length > maxDots) {
      dots.shift().remove();
    }

    setTimeout(() => {
      dot.remove();
      const index = dots.indexOf(dot);
      if (index > -1) dots.splice(index, 1);
    }, 500);
  });
}

// 13. Tilt Card Effect
function tiltCard(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
}

// 14. Intersection Observer for Lazy Loading
function setupLazyLoad(elements, callback) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// 15. Debounce Function
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

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
  // Add ripple effect to buttons
  document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', createRipple);
  });

  // Setup scroll reveal
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  // Setup parallax for floating elements
  const parallaxElements = document.querySelectorAll('[data-speed]');
  parallaxEffect(parallaxElements);

  // Enable mouse trail (optional)
  // createMouseTrail();

  // Add magnetic effect to buttons
  document.querySelectorAll('.cta-button').forEach(button => {
    makeMagnetic(button);
  });
});

// Export for external use
window.VibeAnimations = {
  createRipple,
  animateCounter,
  revealOnScroll,
  staggerAnimate,
  makeMagnetic,
  parallaxEffect,
  typeText,
  animateProgressBar,
  createWaveText,
  tiltCard,
  setupLazyLoad,
  debounce
};