import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";

export default function Lee() {
    return (
        <>
        <EventCard
          color="#FF5733"
          title="Team Meeting"
          description="Weekly team sync to discuss project progress"
          timeStart="2024-03-15T10:00:00"
          timeEnd="2024-03-15T11:00:00"
          toggleEdit={true}
        />
        </>
    )
}