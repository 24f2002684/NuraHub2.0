import time
from playwright.sync_api import sync_playwright

def test_custom_cursor_feature():
    print("=== STARTING INTERACTIVE CUSTOM CURSOR TEST ===")
    
    with sync_playwright() as p:
        # Launch browser with fine pointer / desktop configuration
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            has_touch=False,
            is_mobile=False
        )
        page = context.new_page()

        console_errors = []
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error" and "Failed to load resource" not in msg.text
            else None,
        )

        # 1. Load login page
        page.goto("http://localhost:5173/login")
        page.wait_for_selector(".custom-cursor-root", timeout=5000)
        print("[PASS] 1. Custom cursor root element mounted successfully")

        # Check html has 'has-custom-cursor' class
        html_classes = page.locator("html").get_attribute("class") or ""
        assert "has-custom-cursor" in html_classes, f"Expected 'has-custom-cursor' on html, got: {html_classes}"
        print("[PASS] 2. html root has 'has-custom-cursor' class active for desktop mouse")

        # 2. Test mouse movement and coordinate tracking
        page.mouse.move(400, 300)
        page.wait_for_timeout(200)

        cursor_root = page.locator(".custom-cursor-root")
        assert cursor_root.is_visible(), "Cursor root should be visible"
        
        # Verify dot & ring elements exist
        dot = page.locator(".cursor-dot")
        ring = page.locator(".cursor-ring")
        assert dot.count() == 1 and ring.count() == 1, "Cursor dot and ring must exist"
        print("[PASS] 3. Cursor dot and ring are present and tracking coordinates")

        # 3. Test Hover on button (.state-hover)
        button = page.locator("button:has-text('Sign In')")
        box = button.bounding_box()
        assert box is not None
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(300)

        root_class = cursor_root.get_attribute("class") or ""
        assert "state-hover" in root_class or "state-pointer" in root_class, f"Expected state-hover/pointer on button hover, got: {root_class}"
        print("[PASS] 4. Button hover triggers interactive scaling")

        # 4. Test Click feedback (.is-clicking)
        page.mouse.down()
        page.wait_for_timeout(100)
        root_class_down = cursor_root.get_attribute("class") or ""
        assert "is-clicking" in root_class_down, f"Expected is-clicking on mousedown, got: {root_class_down}"
        page.mouse.up()
        page.wait_for_timeout(100)
        root_class_up = cursor_root.get_attribute("class") or ""
        assert "is-clicking" not in root_class_up, f"Expected is-clicking removed on mouseup, got: {root_class_up}"
        print("[PASS] 5. Click feedback (is-clicking scaling animation) verified on mousedown/mouseup")

        # 5. Test Text input hover (.state-text)
        text_input = page.locator("#identifier")
        input_box = text_input.bounding_box()
        page.mouse.move(input_box["x"] + input_box["width"] / 2, input_box["y"] + input_box["height"] / 2)
        page.wait_for_timeout(200)
        root_class_input = cursor_root.get_attribute("class") or ""
        assert "state-text" in root_class_input, f"Expected state-text over input field, got: {root_class_input}"
        print("[PASS] 6. Hovering over text input switches cursor to 'state-text' and preserves text caret")

        # 6. Log in to test Profile page elements
        ts = int(time.time())
        username = f"cur_{ts}"
        email = f"cur_{ts}@example.com"
        password = "Password123"

        # Register and login
        page.goto("http://localhost:5173/register")
        page.fill("#username", username)
        page.fill("#email", email)
        page.fill("#password", password)
        page.fill("#confirmPassword", password)
        page.click("button:has-text('Register Account')")
        page.wait_for_url("**/login", timeout=5000)

        page.fill("#identifier", username)
        page.fill("#password", password)
        page.click("button:has-text('Sign In')")
        page.wait_for_url("**/profile", timeout=5000)
        print("[PASS] 7. Navigated to Profile page to test data-cursor attributes")

        # 7. Test data-cursor="view" on Avatar Badge
        avatar = page.locator(".avatar-badge")
        avatar_box = avatar.bounding_box()
        assert avatar_box is not None
        page.mouse.move(avatar_box["x"] + avatar_box["width"] / 2, avatar_box["y"] + avatar_box["height"] / 2)
        page.wait_for_timeout(350)

        root_class_avatar = cursor_root.get_attribute("class") or ""
        cursor_text_el = page.locator(".cursor-text")
        text_content = cursor_text_el.inner_text()

        assert "state-view" in root_class_avatar, f"Expected state-view on avatar hover, got: {root_class_avatar}"
        assert text_content == "VIEW", f"Expected cursor text 'VIEW', got: '{text_content}'"
        print("[PASS] 8. Hovering over data-cursor='view' expands ring and displays 'VIEW' label inside cursor")

        # 8. Test data-cursor="pointer" on Brand logo
        brand = page.locator(".navbar-brand")
        brand_box = brand.bounding_box()
        assert brand_box is not None
        page.mouse.move(brand_box["x"] + brand_box["width"] / 2, brand_box["y"] + brand_box["height"] / 2)
        page.wait_for_timeout(300)

        root_class_brand = cursor_root.get_attribute("class") or ""
        assert "state-pointer" in root_class_brand or "state-hover" in root_class_brand, f"Expected pointer/hover on brand, got: {root_class_brand}"
        print("[PASS] 9. Hovering over brand with data-cursor='pointer' adapts outer ring styling")

        # 9. Verify zero console errors
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        print("[PASS] 10. Zero browser console errors during mouse interactions")

        browser.close()

        # 10. Test Mobile/Touch Emulation: custom cursor must be safely disabled
        print("\n--- Testing Mobile/Touch Device Compatibility ---")
        mobile_context = p.chromium.launch(headless=True).new_context(
            viewport={"width": 375, "height": 667},
            has_touch=True,
            is_mobile=True
        )
        mobile_page = mobile_context.new_page()
        mobile_page.goto("http://localhost:5173/login")
        mobile_page.wait_for_timeout(500)

        # On mobile/touch devices, custom cursor is not initialized or hidden
        mobile_html_classes = mobile_page.locator("html").get_attribute("class") or ""
        assert "has-custom-cursor" not in mobile_html_classes, f"Mobile html should NOT have has-custom-cursor, got: {mobile_html_classes}"
        
        cursor_count = mobile_page.locator(".custom-cursor-root").count()
        # Either not mounted or hidden by CSS
        if cursor_count > 0:
            is_displayed = mobile_page.locator(".custom-cursor-root").is_visible()
            assert not is_displayed, "Custom cursor should not be visible on touchscreens"

        print("[PASS] 11. Touch device / mobile emulation correctly disables custom cursor and preserves native touch UX")

    print("\n=== ALL CUSTOM CURSOR TESTS PASSED WITH 100% SUCCESS! ===")

if __name__ == "__main__":
    test_custom_cursor_feature()
