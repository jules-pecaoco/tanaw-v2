import { LineLayer, ShapeSource } from "@rnmapbox/maps";

const FacilityDirection = ({ route, lineColor }) => {

  return (
    <ShapeSource id="routeSource" shape={route.geometry} cluster={false}>
      <LineLayer
        id="directionSource"
        style={{
          lineColor: lineColor,
          lineWidth: 5,
          lineCap: "round",
          lineJoin: "round",
        }}
      ></LineLayer>
    </ShapeSource>
  );
};

export default FacilityDirection;
