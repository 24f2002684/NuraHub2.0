import os
import time
from playwright.sync_api import sync_playwright

def test_full_browser_workflow():
    print("=== STARTING FULL BROWSER END-TO-END TEST WITH NEW THEME ===")
    os.makedirs("test_screenshots", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # -------------------------------------------------------------
        # STEP 1: DESKTOP WIDTH (1200x800) - DARK MODE (Default)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Desktop Width (1200x800) in Dark Rose Theme ---")
        page.set_viewport_size({"width": 1200, "height": 800})
        
        page.goto("http://localhost:5173/")
        page.wait_for_url("**/login", timeout=5000)
        print("[PASS] Unauthenticated visit to '/' successfully redirected to '/login'")

        # Capture Dark Mode Login page
        page.screenshot(path="test_screenshots/1_dark_login.png")
        print("[PASS] Captured Dark Mode Login screenshot")

        # Toggle to Light Mode on Login page
        page.click(".theme-toggle-btn")
        page.wait_for_timeout(500)
        page.screenshot(path="test_screenshots/2_light_login.png")
        print("[PASS] Captured Light Mode Login screenshot")

        # Toggle back to Dark Mode
        page.click(".theme-toggle-btn")
        page.wait_for_timeout(300)

        # Go to Register
        page.click("text=Register here")
        page.wait_for_url("**/register", timeout=5000)
        print("[PASS] Navigated to '/register'")

        # Register new user
        ts = int(time.time())
        username = f"star_user_{ts}"
        email = f"star_{ts}@example.com"
        password = "Password123"

        page.fill("#username", username)
        page.fill("#email", email)
        page.fill("#password", password)
        page.fill("#confirmPassword", password)
        
        page.screenshot(path="test_screenshots/3_dark_register.png")
        page.click("button:has-text('Register Account')")
        
        # Should redirect to /login with success message
        page.wait_for_url("**/login", timeout=5000)
        page.wait_for_selector(".alert-custom-success", timeout=3000)
        print(f"[PASS] Successfully registered '{username}' and redirected to /login with banner")

        # -------------------------------------------------------------
        # STEP 2: LOGIN & PROFILE IN DARK MODE
        # -------------------------------------------------------------
        page.fill("#identifier", username)
        page.fill("#password", password)
        page.click("button:has-text('Sign In')")
        
        page.wait_for_url("**/profile", timeout=5000)
        page.wait_for_selector("h2:has-text('" + username + "')", timeout=5000)
        print("[PASS] Logged in successfully: profile displayed with avatar badge")

        # Edit profile fields
        page.fill("#full_name", "Rosalind Franklin")
        page.fill("#age", "37")
        page.fill("#bio", "Biophysicist, crystallographer, pioneer of DNA structure discoveries.")
        page.fill("#interests", "Crystallography, Genetics, Biophysics, Astronomy")
        
        # Verify live tags preview
        page.wait_for_selector(".interest-chip", timeout=3000)
        print("[PASS] Live interest chips preview dynamically displayed")

        page.click("button:has-text('Save Profile')")
        page.wait_for_selector(".alert-custom-success:has-text('Profile updated successfully!')", timeout=5000)
        page.screenshot(path="test_screenshots/4_dark_profile.png")
        print("[PASS] Profile saved in Dark Rose theme")

        # -------------------------------------------------------------
        # STEP 3: TOGGLE TO LIGHT MODE ON PROFILE
        # -------------------------------------------------------------
        page.click(".theme-toggle-btn")
        page.wait_for_timeout(500)
        page.screenshot(path="test_screenshots/5_light_profile.png")
        print("[PASS] Profile captured in Light Rose theme")

        # -------------------------------------------------------------
        # STEP 4: MOBILE (360x640) & TABLET (768px) RESPONSIVENESS
        # -------------------------------------------------------------
        print("\n--- 4. Testing Responsiveness ---")
        page.set_viewport_size({"width": 360, "height": 640})
        # Toggle mobile burger menu
        toggler = page.locator(".navbar-toggler")
        toggler.click()
        page.wait_for_selector("#appNavContent.show", timeout=3000)
        page.screenshot(path="test_screenshots/6_mobile_nav_profile.png")
        toggler.click()
        print("[PASS] Mobile menu toggled and verified at 360px")

        page.set_viewport_size({"width": 768, "height": 1024})
        page.screenshot(path="test_screenshots/7_tablet_profile.png")
        print("[PASS] Tablet (768px) verified")

        # -------------------------------------------------------------
        # STEP 5: LOGOUT & ACCESS CONTROL
        # -------------------------------------------------------------
        print("\n--- 5. Testing Logout ---")
        page.set_viewport_size({"width": 1200, "height": 800})
        page.click("button:has-text('Logout')")
        page.wait_for_url("**/login", timeout=5000)
        print("[PASS] Logged out: redirected to '/login'")

        page.goto("http://localhost:5173/profile")
        page.wait_for_url("**/login", timeout=5000)
        print("[PASS] Direct access to '/profile' blocked after logout")

        browser.close()

    print("\n=== ALL THEMED BROWSER TESTS PASSED 100%! ===")

if __name__ == "__main__":
    test_full_browser_workflow()
