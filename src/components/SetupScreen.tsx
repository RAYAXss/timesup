import { AppSettings, Difficulty, Team } from '../types/game';
import MobileSetup from './setup/MobileSetup';
import DesktopSetup from './setup/DesktopSetup';

export interface SetupProps {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  timePerPlayer: number;
  setTimePerPlayer: (t: number) => void;
  appSettings: AppSettings;
  setAppSettings: (s: AppSettings) => void;
  onPlay: () => void;
}

export default function SetupScreen(props: SetupProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileSetup {...props} />
      </div>
      <div className="hidden md:block">
        <DesktopSetup {...props} />
      </div>
    </>
  );
}
