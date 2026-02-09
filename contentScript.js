// Query the status and update the nodes directly.
// A bit messy but without webpack, React, Next.js, Kubernetes, and serverless
function pollStatusAndUpdate(component) {
  fetch("https://www.githubstatus.com/api/v2/status.json")
    .then((res) => res.json())
    .then((data) => {
      const { url } = data.page;
      const { indicator, description } = data.status;

      component.icon.classList.remove("none", "minor", "major");
      switch (indicator) {
        case "none":
          component.icon.classList.add("none");
          break;
        case "minor":
          component.icon.classList.add("minor");
          break;
        case "major":
        case "critical":
          component.icon.classList.add("major");
          break;
        default:
      }

      component.text.innerText = description;

      component.link.href = url;
      component.link.classList.add("visible");
    })
    .catch(() => {
      // Silently fail
    });
}

function createButton(className) {
  const link = document.createElement("a");
  link.id = "githubstatus-extension";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.classList.add("githubstatus-extension-link");

  if (className) {
    link.classList.add(className);
  }

  const button = document.createElement("button");
  button.classList.add("btn-sm", "btn");

  const icon = document.createElement("div");
  icon.classList.add("githubstatus-extension-icon");
  button.appendChild(icon);

  const text = document.createElement("span");
  text.classList.add("githubstatus-extension-text");
  button.appendChild(text);

  link.appendChild(button);

  return { link, text, icon };
}

// Try to safely append the button to the header in a few different ways
const targets = [
  (component) => {
    const container = document.querySelector(
      "header div[data-testid='top-nav-center']",
    );
    const firstChild = container && container.firstElementChild;
    if (!container || !firstChild) {
      return false;
    }

    component.link.classList.remove("padded");
    container.insertBefore(component.link, firstChild.nextSibling);
    return true;
  },
  (component) => {
    const container = document.querySelector(
      "header.AppHeader > div.AppHeader-globalBar > div.AppHeader-globalBar-start",
    );
    if (!container) {
      return false;
    }

    component.link.classList.remove("padded");
    container.appendChild(component.link);
    return true;
  },
  (component) => {
    const container = document.querySelector(
      "header.Header > div.Header-item.Header-item--full",
    );
    if (!container || !container.parentNode) {
      return false;
    }

    component.link.classList.add("padded");
    container.parentNode.insertBefore(component.link, container.nextSibling);
    return true;
  },
];

let currentComponent = null;
let interval = null;
let observer = null;
let remountCheckScheduled = false;

function getOrCreateComponent() {
  if (!currentComponent) {
    currentComponent = createButton();
  }
  return currentComponent;
}

function ensureMounted() {
  const component = getOrCreateComponent();
  if (component.link.isConnected) {
    return true;
  }

  for (const mount of targets) {
    try {
      if (mount(component)) {
        return true;
      }
    } catch {
      // Try the next target
    }
  }

  return false;
}

function pollCurrentStatus() {
  if (!ensureMounted()) {
    return;
  }

  pollStatusAndUpdate(currentComponent);
}

function ensurePolling() {
  if (interval) {
    return;
  }

  interval = setInterval(() => {
    pollCurrentStatus();
  }, 30000);
}

function scheduleRemountCheck() {
  if (remountCheckScheduled) {
    return;
  }

  remountCheckScheduled = true;
  setTimeout(() => {
    remountCheckScheduled = false;
    ensureMounted();
  }, 0);
}

function ensureObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    if (!currentComponent || !currentComponent.link.isConnected) {
      scheduleRemountCheck();
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function run() {
  ensureObserver();
  ensurePolling();
  pollCurrentStatus();
}

// Using Github's turbo:load event to handle navigation
document.documentElement.addEventListener("turbo:load", run);
run();
