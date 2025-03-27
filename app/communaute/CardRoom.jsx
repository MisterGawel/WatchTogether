import {Card, CardHeader, CardBody, Image,Button} from "@heroui/react";

export default function CardRoom({ room,role,Suppresion}) {
const image = "https://heroui.com/images/hero-card-complete.jpeg"
return(
        <Card  className="shadow-lg py-4">
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
            <h4 className="font-bold text-large">{room}</h4>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
            
        { <Image src={image} alt="Salle" className="object-cover rounded-xl" width={270} /> }
        {role === "admin" && (
            <Button
            onPress={Suppresion}
            size="sm"
            variant="light"
            color="danger"
            className="mt-2"
            >
            Supprimer
            </Button>
        )}
        </CardBody>
        </Card>
)
}