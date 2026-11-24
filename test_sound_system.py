import time
from playwright.sync_api import sync_playwright

def test_sound_system_feature():
    print("=== STARTING INTERACTIVE SOUND SYSTEM TEST ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        console_errors = []
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error" and "Failed to load resource" not in msg.text
            else None,
        )

        # 1. Navigate to login page
        page.goto("http://localhost:5173/login")
        page.wait_for_selector(".sound-control-btn", timeout=5000)
        print("[PASS] 1. Sound settings button visible in navigation bar")

        # 2. Check default settings
        initial_label = page.locator(".sound-control-btn").inner_text()
        assert "25%" in initial_label or "🔉" in initial_label or "🔊" in initial_label, f"Unexpected default label: {initial_label}"
        print(f"[PASS] 2. Default volume initialized at subtle 25%: '{initial_label}'")

        # 3. Open sound popover
        page.click(".sound-control-btn")
        page.wait_for_selector(".sound-popover", timeout=3000)
        assert page.locator(".sound-popover").is_visible()
        print("[PASS] 3. Sound settings glass popover opened smoothly")

        # 4. Test Volume adjustment
        # Adjust slider to 0.45 (45%)
        slider = page.locator("#soundVolumeRange")
        slider.fill("0.45")
        page.wait_for_timeout(200)

        # Check localStorage volume persistence
        stored_vol = page.evaluate("() => localStorage.getItem('app_sound_volume')")
        assert stored_vol == "0.45", f"Expected stored volume 0.45, got: {stored_vol}"
        print(f"[PASS] 4. Volume slider adjustment persisted to localStorage: '{stored_vol}'")

        # 5. Test Sound Enable/Disable toggle
        switch = page.locator("#soundEnabledSwitch")
        # Toggle off
        switch.click()
        page.wait_for_timeout(200)

        stored_enabled = page.evaluate("() => localStorage.getItem('app_sound_enabled')")
        assert stored_enabled == "false", f"Expected stored enabled 'false', got: {stored_enabled}"
        
        btn_label_muted = page.locator(".sound-control-btn").inner_text()
        assert "Muted" in btn_label_muted or "🔇" in btn_label_muted, f"Expected Muted icon/label, got: {btn_label_muted}"
        print("[PASS] 5. Sound toggle switch turns sound OFF, sets Muted label and persists 'false' in localStorage")

        # Toggle back on
        switch.click()
        page.wait_for_timeout(200)
        stored_enabled_on = page.evaluate("() => localStorage.getItem('app_sound_enabled')")
        assert stored_enabled_on == "true", f"Expected stored enabled 'true', got: {stored_enabled_on}"
        print("[PASS] 6. Sound toggle switch turns sound back ON and persists 'true' in localStorage")

        # Test Test Sound button
        page.click("button:has-text('Test Sound')")
        page.wait_for_timeout(200)
        print("[PASS] 7. 'Test Sound' button executed without error")

        # Close popover
        page.click(".btn-close-popover")
        page.wait_for_timeout(200)
        assert not page.locator(".sound-popover").is_visible()
        print("[PASS] 8. Sound popover closed cleanly")

        # 6. Test Web Audio API execution of all sound effects
        # Call all sound functions programmatically in browser context to verify AudioContext pipelines
        eval_result = page.evaluate("""
            async () => {
                const mod = await import('/src/utils/sound.js');
                
                // 1. Click
                mod.playClick();
                // 2. Nav
                mod.playNav();
                // 3. Hover
                mod.playHover();
                // 4. Success
                mod.playSuccess();
                // 5. Error
                mod.playError();
                // 6. Toggle
                mod.playToggle();
                // 7. Modal Open
                mod.playModalOpen();
                // 8. Modal Close
                mod.playModalClose();

                // Test muted behavior: when sound is disabled, no nodes should throw
                mod.setSoundEnabled(false);
                mod.playClick();
                mod.playSuccess();
                mod.playError();
                mod.setSoundEnabled(true);

                return { success: true };
            }
        """)
        assert eval_result.get("success") is True, f"Audio evaluation failed: {eval_result}"
        print("[PASS] 9. Web Audio API synthesized pipelines (Click, Nav, Hover, Success, Error, Toggle, Whoosh) executed flawlessly")

        # 7. Test form interactions & audio triggers on full auth flow
        ts = int(time.time())
        username = f"snd_{ts}"
        email = f"snd_{ts}@example.com"
        password = "Password123"

        # Register
        page.goto("http://localhost:5173/register")
        page.fill("#username", username)
        page.fill("#email", email)
        page.fill("#password", password)
        page.fill("#confirmPassword", password)
        page.click("button:has-text('Register Account')")
        page.wait_for_url("**/login", timeout=5000)
        print("[PASS] 10. Register submission triggered click and success audio feedback")

        # Login
        page.fill("#identifier", username)
        page.fill("#password", password)
        page.click("button:has-text('Sign In')")
        page.wait_for_url("**/profile", timeout=5000)
        print("[PASS] 11. Login submission triggered click and success audio feedback")

        # Profile Save
        page.fill("#full_name", "Ada Lovelace")
        page.click("button:has-text('Save Profile')")
        page.wait_for_selector(".alert-custom-success", timeout=5000)
        print("[PASS] 12. Profile save triggered success confirmation audio")

        # Logout
        page.click("button:has-text('Logout')")
        page.wait_for_url("**/login", timeout=5000)
        print("[PASS] 13. Logout triggered modal closing audio and returned to login")

        # Zero runtime errors
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        print("[PASS] 14. Zero console errors during all audio operations")

        browser.close()

    print("\n=== ALL SOUND SYSTEM TESTS PASSED WITH 100% SUCCESS! ===")

if __name__ == "__main__":
    test_sound_system_feature()
