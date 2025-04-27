import { BasicNavBar } from "@renderer/components/business/app/nav-bar/basic-nav-bar";

export function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <BasicNavBar />
      <div className="flex flex-col">
        <h1>Settings</h1>
      </div>
    </div>
  );
}
