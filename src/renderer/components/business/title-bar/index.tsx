import {
  TitlebarCenter,
  TitlebarContainer,
  TitlebarRight,
} from "@renderer/components/business/title-bar/title-bar-container";
import { TabBar } from "../tab-bar";

export function BasicTitleBar() {
  return (
    <TitlebarContainer>
      <TitlebarCenter>
        <TabBar />
      </TitlebarCenter>

      <TitlebarRight />
    </TitlebarContainer>
  );
}
