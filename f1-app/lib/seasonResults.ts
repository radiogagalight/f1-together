import type { Firestore } from "firebase/firestore";
import { loadAllClassifications } from "./classificationStorage";
import { aggregateChampionship, mergeClassifications } from "./f1Points";
import { loadAllRaceResults } from "./resultsStorage";
import type { SeasonResultsPayload } from "./types";

export async function loadSeasonResultsPayload(
  db: Firestore
): Promise<SeasonResultsPayload> {
  const [stored, raceResults] = await Promise.all([
    loadAllClassifications(db),
    loadAllRaceResults(db),
  ]);

  const classifications = mergeClassifications(stored, raceResults);
  const { driverStandings, constructorStandings, completedRounds } =
    aggregateChampionship(classifications, raceResults);

  return {
    classifications,
    driverStandings,
    constructorStandings,
    completedRounds,
    raceResults,
  };
}
