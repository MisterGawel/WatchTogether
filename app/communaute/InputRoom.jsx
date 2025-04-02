          
import {Card,Button,Input} from "@heroui/react";
export default function InputRoom({ ValeurChamp,role,foncNewAnnonce,foncaddAnnonce}) {
  return(
role === "admin" && (
  <div className="mb-4">
    <Card className="shadow-lg p-4">
      <h3 className="text-lg font-semibold">Ajouter une Salle</h3>
      <Input
        value={ValeurChamp}
        onChange={foncNewAnnonce}
        placeholder="Nom room"
        className="w-full mt-2"
      />
      <Button onPress={foncaddAnnonce} className="mt-2 w-full">
        Ajouter la carte
      </Button>
    </Card>
  </div>

  )
)
}