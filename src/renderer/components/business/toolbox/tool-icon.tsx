import ai3DModelingIcon from "@renderer/assets/icons/toolbox/AI-3D-Modeling.svg";
import aiAcademicPaperSearchIcon from "@renderer/assets/icons/toolbox/AI-Academic-Paper-Search.svg";
import aiAnswerMachineIcon from "@renderer/assets/icons/toolbox/AI-Answer-Machine.svg";
import aiAvatarProductionIcon from "@renderer/assets/icons/toolbox/AI-Avatar-Production.svg";
import aiCardGenerationIcon from "@renderer/assets/icons/toolbox/AI-Card-Generation.svg";
import aiChangeClothesIcon from "@renderer/assets/icons/toolbox/AI-Change-Clothes.svg";
import aiCopywritingAssistantIcon from "@renderer/assets/icons/toolbox/AI-Copywriting-Assistant.svg";
import aiDeeplyTranslationIcon from "@renderer/assets/icons/toolbox/AI-Deeply-Translation.svg";
import aiDocumentEditorIcon from "@renderer/assets/icons/toolbox/AI-Document-Editor.svg";
import aiDrawingBoardIcon from "@renderer/assets/icons/toolbox/AI-Drawing-Board.svg";
import aiDrawingPromptWordExpertIcon from "@renderer/assets/icons/toolbox/AI-Drawing-Prompt-Word-Expert.svg";
import aiEcommerceCopywritingAssistantIcon from "@renderer/assets/icons/toolbox/AI-E-commerce-Copywriting-Assistant.svg";
import aiEcommerceSceneImageGenerationIcon from "@renderer/assets/icons/toolbox/AI-E-commerce-Scene-Image-Generation.svg";
import aiExcelIcon from "@renderer/assets/icons/toolbox/AI-Excel.svg";
import aiFactsProofIcon from "@renderer/assets/icons/toolbox/AI-Facts-Proof.svg";
import aiFinancialInformationAssistantIcon from "@renderer/assets/icons/toolbox/AI-Financial-Information-Assistant.svg";
import aiImageCreativeStationIcon from "@renderer/assets/icons/toolbox/AI-Image-Creative-Station.svg";
import aiImageToolboxIcon from "@renderer/assets/icons/toolbox/AI-Image-Toolbox.svg";
import aiLoraCreationStationIcon from "@renderer/assets/icons/toolbox/AI-Lora-Creation-Station.svg";
import aiModelJudgeIcon from "@renderer/assets/icons/toolbox/AI-Model-Judge.svg";
import aiMusicMakerIcon from "@renderer/assets/icons/toolbox/AI-Music-Maker.svg";
import aiNovelWritingIcon from "@renderer/assets/icons/toolbox/AI-Novel-Writing.svg";
import aiOldPhotoRestorationIcon from "@renderer/assets/icons/toolbox/AI-Old-Photo-Restoration.svg";
import aiPaperWritingIcon from "@renderer/assets/icons/toolbox/AI-Paper-Writing.svg";
import aiPatentSearchIcon from "@renderer/assets/icons/toolbox/AI-Patent-Search.svg";
import aiPhotoTranslationIcon from "@renderer/assets/icons/toolbox/AI-Photo-Translation.svg";
import aiPodcastProductionIcon from "@renderer/assets/icons/toolbox/AI-Podcast-Production.svg";
import aiPPTProductionIcon from "@renderer/assets/icons/toolbox/AI-PPT-Production.svg";
import aiPromptExpertIcon from "@renderer/assets/icons/toolbox/AI-Prompt-Expert.svg";
import aiPromptExpert2Icon from "@renderer/assets/icons/toolbox/AI-Prompt-Expert.svg";
import aiRedEnvelopeCoverGenerationIcon from "@renderer/assets/icons/toolbox/AI-Red-Envelope-Cover-Generation.svg";
import aiResearchMasterIcon from "@renderer/assets/icons/toolbox/AI-Research-Master.svg";
import aiResumeCreationIcon from "@renderer/assets/icons/toolbox/AI-Resume-Creation.svg";
import aiSearchMaster3Icon from "@renderer/assets/icons/toolbox/AI-Search-Master-3.svg";
import aiSpeechArenaIcon from "@renderer/assets/icons/toolbox/AI-Speech-Arena.svg";
import aiSpeechCallIcon from "@renderer/assets/icons/toolbox/AI-Speech-Call.svg";
import aiSpeechGeneratorIcon from "@renderer/assets/icons/toolbox/AI-Speech-Generator.svg";
import aiSVGProductionIcon from "@renderer/assets/icons/toolbox/AI-SVG-Production.svg";
import aiTalkingPhotoIcon from "@renderer/assets/icons/toolbox/AI-Talking-Photo.svg";
import aiTranslateMasterIcon from "@renderer/assets/icons/toolbox/AI-Translate-Master.svg";
import aiVideoCreationStationIcon from "@renderer/assets/icons/toolbox/AI-Video-Creation-Station.svg";
import aiVideoGeneratorIcon from "@renderer/assets/icons/toolbox/AI-Video-Generator.svg";
import aiVideoSummaryIcon from "@renderer/assets/icons/toolbox/AI-Video-Summary.svg";
import aiVideoTranslationIcon from "@renderer/assets/icons/toolbox/AI-Video-Translation.svg";
import aiWebpageGeneratorIcon from "@renderer/assets/icons/toolbox/AI-Webpage-Generator.svg";
import aiWebpageGenerator2Icon from "@renderer/assets/icons/toolbox/AI-Webpage-Generator-2.svg";
import aiWebpageSummaryIcon from "@renderer/assets/icons/toolbox/AI-Webpage-Summary.svg";
import codeArenaIcon from "@renderer/assets/icons/toolbox/Code-Arena.svg";
import comfyUIToolboxIcon from "@renderer/assets/icons/toolbox/ComfyUI-Toolbox.svg";
import DeployWebPagesByOneclickIcon from "@renderer/assets/icons/toolbox/Deploy-Web-Pages-By-Oneclick.svg";
import drawingRobotIcon from "@renderer/assets/icons/toolbox/Drawing-Robot.svg";
import idPhotoProductionIcon from "@renderer/assets/icons/toolbox/ID-Photo-Production.svg";
import aiImageArenaIcon from "@renderer/assets/icons/toolbox/Image-Arena.svg";
import modelArenaIcon from "@renderer/assets/icons/toolbox/Model-Arena.svg";
import pdfComprehensiveToolboxIcon from "@renderer/assets/icons/toolbox/PDF-Comprehensive-Toolbox.svg";
import videoArenaIcon from "@renderer/assets/icons/toolbox/Video-Arena.svg";
import WebDataExtractionToolIcon from "@renderer/assets/icons/toolbox/Web-Data-Extraction-Tool.svg";

import { cn } from "@renderer/lib/utils";
import { useMemo } from "react";

const iconMap: Record<string, string> = {
  // * Work Efficiency
  7: modelArenaIcon,
  21: aiCopywritingAssistantIcon,
  25: aiEcommerceCopywritingAssistantIcon,
  28: aiDocumentEditorIcon,
  30: aiPPTProductionIcon,
  43: aiWebpageSummaryIcon,
  45: aiDrawingBoardIcon,
  48: aiFinancialInformationAssistantIcon,
  49: aiExcelIcon,
  51: aiResumeCreationIcon,
  75: aiNovelWritingIcon,

  // * Academic Related
  12: aiAcademicPaperSearchIcon,
  15: pdfComprehensiveToolboxIcon,
  18: aiPatentSearchIcon,
  23: aiPaperWritingIcon,
  56: aiAnswerMachineIcon,
  46: aiAvatarProductionIcon,

  // * Information Processing
  4: aiResearchMasterIcon,
  5: aiTranslateMasterIcon,
  14: aiPromptExpertIcon,
  17: aiSearchMaster3Icon,
  57: WebDataExtractionToolIcon,
  63: aiPromptExpert2Icon,
  66: aiFactsProofIcon,
  70: DeployWebPagesByOneclickIcon,
  72: aiCardGenerationIcon,
  74: aiModelJudgeIcon,

  // * Image Processing
  "-1": drawingRobotIcon,
  11: aiOldPhotoRestorationIcon,
  13: aiEcommerceSceneImageGenerationIcon,
  19: aiImageToolboxIcon,
  39: aiPhotoTranslationIcon,
  42: idPhotoProductionIcon,
  47: aiTalkingPhotoIcon,
  54: aiRedEnvelopeCoverGenerationIcon,
  55: aiChangeClothesIcon,
  58: aiSVGProductionIcon,
  59: aiImageArenaIcon,
  60: ai3DModelingIcon,
  65: aiLoraCreationStationIcon,
  69: comfyUIToolboxIcon,
  71: aiDrawingPromptWordExpertIcon,
  73: aiImageCreativeStationIcon,

  // * Audio Related
  24: aiSpeechGeneratorIcon,
  38: aiMusicMakerIcon,
  41: aiPodcastProductionIcon,
  44: aiSpeechCallIcon,
  76: aiSpeechArenaIcon,

  // * Video Related
  10: aiVideoCreationStationIcon,
  16: aiVideoGeneratorIcon,
  20: aiVideoSummaryIcon,
  27: aiVideoTranslationIcon,
  53: aiDeeplyTranslationIcon,
  68: videoArenaIcon,

  // * Code Related
  8: aiWebpageGeneratorIcon,
  40: aiWebpageGenerator2Icon,
  61: codeArenaIcon,
};

// Create a reverse mapping for easy lookup by icon name (for debugging)
const iconNameMap: Record<string, number> = {};
Object.entries(iconMap).forEach(([toolId, iconPath]) => {
  const iconName = iconPath.split("/").pop()?.replace(".svg", "") || "";
  iconNameMap[iconName] = Number(toolId);
});

interface ToolIconProps {
  toolId: number;
  className?: string;
  alt?: string;
}

function getIconFromToolId(toolId: number): string {
  return iconMap[`${toolId}`] || "";
}

export function ToolIcon({ toolId, className, alt }: ToolIconProps) {
  const iconUrl = useMemo(() => getIconFromToolId(toolId), [toolId]);

  return (
    <img
      src={iconUrl}
      className={cn("h-9 w-9 rounded-lg", className)}
      alt={alt || `Tool ${toolId} Icon`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== "") {
          target.src = "";
        }
      }}
    />
  );
}

// Export the mapping for potential use in other components
export { iconMap, iconNameMap };
