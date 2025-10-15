document.addEventListener("DOMContentLoaded", () => {
  let config
  let currentModuleIndex = 0

  const h2ModuleName = document.getElementById("module-name")
  const table = document.querySelector("tbody")
  const rowTemplate = document.getElementById("row-template")
  const commandBox = document.getElementById("command")
  const copyButton = document.getElementById("copy-button")
  const moduleList = document.getElementById("module-list")
  const themeToggle = document.getElementById("theme-toggle")
  const themeIcon = document.querySelector(".theme-icon")

  // Theme toggle functionality
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    updateThemeIcon(savedTheme)
  }

  const updateThemeIcon = (theme) => {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙'
  }

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateThemeIcon(newTheme)
  }

  themeToggle.addEventListener("click", toggleTheme)
  initTheme()

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(commandBox.textContent)
      .then(() => {
        const original = copyButton.textContent;
        copyButton.textContent = '¡Copiado!';
        setTimeout(() => copyButton.textContent = original, 1200);
      })
  })

  document.getElementById("module-search").addEventListener("input", function () {
    const filter = this.value.toLowerCase()
    const modules = document.querySelectorAll(".module-item")
    modules.forEach(module => {
      const text = module.textContent.toLowerCase()
      module.style.display = text.includes(filter) ? "" : "none"
    })
  })

  const loadConfig = async () => {
    const res = await fetch("config.json")
    if (!res.ok) {
      throw new Error("Error al cargar la configuración")
    }

    config = await res.json()
    console.log(config)
    renderModuleList()
    updateModule(0)
  }

  const renderModuleList = () => {
    moduleList.innerHTML = ""
    config.modules.sort((a, b) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    })
    config.modules.forEach((module, index) => {
      const li = document.createElement("li")
      li.textContent = module.name
      li.classList.add("module-item")
      li.addEventListener("click", () => {
        // Quitar anterior
        moduleList.querySelectorAll("li").forEach(item => item.classList.remove("selected"))
        // Seleccionar actual
        li.classList.add("selected")
        currentModuleIndex = index
        updateModule(index)
      })
      
      // Seleccionar el primer módulo por defecto
      if (index === 0) {
        li.classList.add("selected")
      }
      
      moduleList.appendChild(li)
    })
  }

  table.addEventListener("change", (event) => {
    if (event.target.type === "radio") {
      updateCommand(config.modules[currentModuleIndex])
    }
  })

  const updateModule = (pos) => {
    currentModuleIndex = pos
    h2ModuleName.textContent = config.modules[pos].name
    renderLevels(config.modules[pos])
    updateCommand(config.modules[pos])
  }

  const renderLevels = (module) => {
    table.innerHTML = ""
    const fragment = document.createDocumentFragment()

    const defaultValues = parseDefaultString(module.default, module.positions.length)

    module.positions.forEach((position, idx) => {
      const clone = rowTemplate.content.cloneNode(true)
      const tdName = clone.querySelector(".position-name")
      tdName.textContent = position

      const defaultValue = defaultValues[idx] || "0"

      clone.querySelectorAll("input").forEach((input) => {
        input.name = `traceLevel-${idx}`
        input.dataset.index = idx

        if (input.value === defaultValue) {
          input.checked = true
        } else {
          input.checked = false
        }
      })
      fragment.appendChild(clone)
    })
    table.appendChild(fragment)
  }

  const updateCommand = (module) => {

    let hexValue = ""
    for (let i = module.positions.length - 1; i >= 0; i--) {
      const checked = document.querySelector(`input[name="traceLevel-${i}"]:checked`)
      hexValue += checked ? checked.value.toUpperCase() : "0"
    }

    if (module.name === "App BoB") {
      if (hexValue === "0") {
        commandBox.textContent = `TlfSetVariable Debug/DebugVannevarBrowser -r
TlfSetVariable Debug/debugEnabled -r
TlfSetVariable Debug/debugLevel -r`
      } else {
        commandBox.textContent = `TlfSetVariable Debug/DebugVannevarBrowser true
TlfSetVariable Debug/debugEnabled true
TlfSetVariable Debug/debugLevel debug,info,warn,error,table,log`
      }
      return
    }

    if (module.name === "App Latam") {
      if (hexValue === "0") {
        commandBox.textContent = `TlfSetVariable Debug/DebugVannevarBrowser -r
TlfSetVariable Debug/DebugStvIptv -r`
      } else {
        commandBox.textContent = `TlfSetVariable Debug/DebugVannevarBrowser true
TlfSetVariable Debug/DebugStvIptv 0xff`
      }
      return
    }

    commandBox.textContent = `TlfSetVariable Debug/Debug${module.name} 0x${hexValue}`
  }

  const parseDefaultString = (defaultString, posCount) => {
    if (!defaultString) {
      return Array(posCount).fill("0")
    }

    let hexString = defaultString.replace("0x", "").toUpperCase()
    hexString = hexString.padStart(posCount, '0')
    const hexArray = hexString.split("").reverse()
    return hexArray
  }

  loadConfig()
})