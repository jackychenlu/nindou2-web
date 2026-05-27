import {
  mapObjectBuilders,
  buildMapObjects as buildMapObjectsModule,
  buildCountry10Objects as buildCountry10ObjectsModule,
  buildEvilCastle1Objects as buildEvilCastle1ObjectsModule,
  buildEvilCastle2Objects as buildEvilCastle2ObjectsModule,
  buildEvilCastleObjects as buildEvilCastleObjectsModule,
} from "../data/map.module.mjs";

export function installMapGlobals(target = globalThis) {
  const buildMapObjects = () => {
    const mapDefinition = target.currentRoomMapDefinition?.();
    return buildMapObjectsModule({
      mapDefinition,
      internalCellCoord: target.internalCellCoord,
      baseObjectHp: target.objectHp,
    });
  };

  const buildCountry10Objects = () => buildCountry10ObjectsModule({
    internalCellCoord: target.internalCellCoord,
    objectHp: target.objectHp,
  });

  const buildEvilCastle1Objects = () => buildEvilCastle1ObjectsModule({
    internalCellCoord: target.internalCellCoord,
  });

  const buildEvilCastle2Objects = () => buildEvilCastle2ObjectsModule({
    internalCellCoord: target.internalCellCoord,
  });

  const buildEvilCastleObjects = (layout) => buildEvilCastleObjectsModule(layout, {
    internalCellCoord: target.internalCellCoord,
  });

  target.mapObjectBuilders = mapObjectBuilders;
  target.buildMapObjects = buildMapObjects;
  target.buildCountry10Objects = buildCountry10Objects;
  target.buildEvilCastle1Objects = buildEvilCastle1Objects;
  target.buildEvilCastle2Objects = buildEvilCastle2Objects;
  target.buildEvilCastleObjects = buildEvilCastleObjects;
  target.NindouMaps = {
    mapObjectBuilders,
    buildMapObjects,
    buildCountry10Objects,
    buildEvilCastle1Objects,
    buildEvilCastle2Objects,
    buildEvilCastleObjects,
  };
}
