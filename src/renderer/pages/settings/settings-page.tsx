import { BasicTitleBar } from "@renderer/components/business/app/title-bar/basic-title-bar";

export function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <BasicTitleBar />
      <div className="flex flex-col">
        <h1>Settings</h1>
      </div>
    </div>
  );
}
