(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s || "").replace(/\s+/g, " ").trim();

  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.display !== "none" && s.visibility !== "hidden";
  };

  const labels = el => [
    el.getAttribute("aria-label"),
    el.getAttribute("title"),
    el.getAttribute("data-tooltip-content"),
    el.innerText
  ].map(norm).filter(Boolean);

  const elements = () => [
    ...document.querySelectorAll(
      'button, [role="button"], a, [aria-label], [title], [data-tooltip-content]'
    )
  ].filter(visible);

  const isShare = el => labels(el).some(s =>
    /^share\s*,\s*[\d,.]+\s*[km]?\s+shares?/i.test(s) ||
    /^share$/i.test(s) ||
    /^chia sẻ$/i.test(s)
  );

  const findShareNow = () => elements().find(el =>
    el.matches('button, [role="button"]') &&
    labels(el).some(s =>
      /^share now$/i.test(s) || /^chia sẻ ngay$/i.test(s)
    )
  );

  window.stopShareLoop = false;
  window.stopShareLoopNow = () => {
    window.stopShareLoop = true;
    console.log("Đã yêu cầu dừng.");
  };

  // Tăng giới hạn tối đa từ 10 lên 200, mặc định nhập là 200
  const raw = prompt("Số lượt tối đa (1–200):", "200");
  if (raw === null) return;

  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1 || count > 200) {
    console.error("Số lượt không hợp lệ (cần từ 1 đến 200).");
    return;
  }

  for (let i = 1; i <= count; i++) {
    if (window.stopShareLoop) break;

    console.log(`Lượt ${i}/${count}`);

    const all = elements().filter(isShare);
    const candidates = all.filter(el =>
      !all.some(other =>
        other !== el &&
        other.contains(el) &&
        labels(other).some(s => labels(el).includes(s))
      )
    );

    if (!candidates.length) {
      console.warn("Không tìm thấy nút Share.");
      break;
    }

    // Tự chọn mục 0
    candidates[0].click();

    let submit = null;
    for (let j = 0; j < 40; j++) {
      if (window.stopShareLoop) break;
      await sleep(250);
      submit = findShareNow();
      if (submit) break;
    }

    if (window.stopShareLoop) break;

    if (!submit) {
      console.warn("Không tìm thấy Share now.");
      break;
    }

    submit.click();
    console.log(`Đã nhấn Share now lượt ${i}.`);

    await sleep(5000);

    if (i < count) {
      // Cuộn để tải nội dung kế tiếp
      window.scrollBy({
        top: Math.floor(window.innerHeight * 0.8),
        behavior: "smooth"
      });

      await sleep(3000);
    }
  }

  console.log("Đã kết thúc vòng lặp.");
})();
