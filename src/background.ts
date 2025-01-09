import { Storage } from "@plasmohq/storage"

import { fetchRoomData } from "~utils/platforms"

const storage = new Storage()

let checkInterval: NodeJS.Timeout | null = null

// 添加错误处理函数
function handleError(error: Error) {
  if (error.message === "Extension context invalidated.") {
    // 扩展被重载或禁用，清理资源
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    return
  }
  console.error(error)
}

async function updateNewTabOverride() {
  const replaceNewTab = await storage.get<boolean>("replace_new_tab")
  try {
    if (replaceNewTab) {
      await chrome.tabs.update({
        url: chrome.runtime.getURL("newtab.html")
      })
    }
  } catch (error) {
    console.error("更新新标签页设置失败:", error)
  }
}

async function checkLiveStatus() {
  console.log("checkLiveStatus")
  try {
    const enableNotification = await storage.get<boolean>("enable_notification")
    if (!enableNotification) return

    const { rooms } = await fetchRoomData()
    const lastStatus = await storage.get<Record<string, boolean>>("last_status")
    const newStatus: Record<string, boolean> = {}
    console.log(lastStatus)
    for (const room of rooms) {
      newStatus[room.roomId] = room.isOpen
      if (lastStatus && !lastStatus[room.roomId] && room.isOpen) {
        try {
          await chrome.notifications.create(room.roomId, {
            type: "basic",
            iconUrl: room.avatar,
            title: `${room.streamerName} 开播了`,
            message: room.roomName,
            priority: 2
          })
        } catch (error) {
          handleError(error as Error)
          return
        }
      }
    }

    await storage.set("last_status", newStatus)
  } catch (error) {
    handleError(error as Error)
  }
}

async function updateLiveCheck() {
  console.log("updateLiveCheck")
  try {
    const enableNotification = await storage.get<boolean>("enable_notification")

    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }

    if (enableNotification) {
      await checkLiveStatus()
      checkInterval = setInterval(checkLiveStatus, 60 * 1000)
    }
  } catch (error) {
    handleError(error as Error)
  }
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.replace_new_tab) {
    // 不要在这里直接调用 updateNewTabOverride
    console.log("新标签页设置已更改")
  }
  if (changes.enable_notification) {
    updateLiveCheck().catch(handleError)
  }
})

// 监听通知点击
chrome.notifications.onClicked.addListener((roomId) => {
  try {
    chrome.tabs
      .create({
        url: `chrome-extension://${chrome.runtime.id}/newtab.html`
      })
      .catch(handleError)
  } catch (error) {
    handleError(error as Error)
  }
})

// 初始化
updateLiveCheck().catch(handleError)
