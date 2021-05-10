chrome.runtime.sendMessage(
  {
    data: sessionStorage.getItem("userToken").replaceAll('"', ""),
  },
  function (response) {}
);
