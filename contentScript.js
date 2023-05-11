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
  () => {
    try {
      const container = document.querySelector(
        "header.AppHeader > div.AppHeader-globalBar > div.AppHeader-globalBar-start"
      );
      const component = createButton();
      container.appendChild(component.link);

      return component;
    } catch {
      return false;
    }
  },
  () => {
    try {
      const container = document.querySelector(
        "header.Header > div.Header-item.Header-item--full"
      );
      const component = createButton("padded");
      container.parentNode.insertBefore(component.link, container.nextSibling);

      return component;
    } catch {
      return false;
    }
  },
];

let interval = null;

function run() {
  const currentNode = document.getElementById("githubstatus-extension");
  if (currentNode) {
    return;
  }

  for (const insert of targets) {
    const component = insert();
    if (component) {
      currentComponent = component;

      pollStatusAndUpdate(component);

      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => pollStatusAndUpdate(component), 30000);

      break;
    }
  }
}

// Using Github's turbo:load event to handle navigation
document.documentElement.addEventListener("turbo:load", run);
