function createButton(className) {
  const link = document.createElement("a");
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

  fetch("https://www.githubstatus.com/api/v2/status.json")
    .then((res) => res.json())
    .then((data) => {
      const { url } = data.page;
      link.href = url;

      const { indicator, description } = data.status;

      switch (indicator) {
        case "none":
          icon.classList.add("none");
          break;
        case "minor":
          icon.classList.add("minor");
          break;
        case "major":
        case "critical":
          icon.classList.add("major");
          break;
        default:
      }

      text.innerText = description;

      link.classList.add("visible");
    })
    .catch(() => {
      // Silently fail
    });

  return link;
}

const targets = [
  () => {
    try {
      const container = document.querySelector(
        "header.AppHeader > div.AppHeader-globalBar > div.AppHeader-globalBar-start"
      );
      container.appendChild(createButton());
    } catch {
      return false;
    }

    return true;
  },
  () => {
    try {
      const container = document.querySelector(
        "header.Header > div.Header-item.Header-item--full"
      );
      container.parentNode.insertBefore(
        createButton("padded"),
        container.nextSibling
      );
    } catch {
      return false;
    }

    return true;
  },
];

for (const insert of targets) {
  if (insert()) {
    break;
  }
}
