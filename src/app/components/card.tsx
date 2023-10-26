"use client"
import { useState, useEffect} from 'react'
import { Button } from "@/components/ui/button"
import { PlusSquare, Edit, Save, XSquareIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategoryStock } from "@/types/category";

interface CardProps {
    stock: CategoryStock;
    onAdd: (quantityAdded: number) => void;
    onEdit: (quantityEdited: number) => void;
  }

export default function CardComponent(props: CardProps) {

    const [addMode, setAddMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [quantityAdded, setQuantityAdded] = useState(0);
    const [quantityEdited, setQuantityEdited] = useState(0);

    const stock = props.stock;

    function onSaveClick() {
        if (addMode) {
            props.onAdd(quantityAdded);
            setAddMode(false);
        } else if (editMode) {
            props.onEdit(quantityEdited);
            setEditMode(false);
        }
    }

    function onCancelClick() {
        if (addMode) {
            setAddMode(false);
        } else if (editMode) {
            setEditMode(false);
        }
    }

    return (
        <Card key={stock.id}>
            <CardHeader>
                <CardTitle>{stock.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-center font-bold text-2xl">
                <p>{stock.quantity}lbs</p>
                {addMode && 
                    <div className="grid w-full max-w-sm items-center justify-center gap-1.5">
                        <br />
                        <Label htmlFor="edit-quantity">Enter Quantity to Add</Label>
                        <Input type="number" id="edit-quantity" placeholder="Quantity" onChange={(e) => setQuantityAdded(Number(e.target.value))} />
                    </div>
                }
                {editMode &&
                    <div className="grid w-full max-w-sm items-center justify-center gap-1.5">
                        <br />
                        <Label htmlFor="add-quantity">Enter New Quantity</Label>
                        <Input type="number" id="add-quantity" placeholder="Quantity" onChange={(e) => setQuantityEdited(Number(e.target.value))} />
                    </div>
                }
            </CardContent>
            <CardFooter className="py-8 grid grid-cols-1 gap-8 md:grid-cols-2">

                {editMode || addMode ? 
                    <>
                        <Button className="bg-blue-600" onClick={onSaveClick}>
                            <Save className="mr-2 h-4 w-4"/> Save
                        </Button>
                        <Button className="bg-red-600" onClick={onCancelClick}>
                            <XSquareIcon className="mr-2 h-4 w-4"/> Cancel
                        </Button>
                    </>                       
                : 
                    <>
                        <Button className="bg-green-600" onClick={() => setAddMode(true)}>
                            <PlusSquare className="mr-2 h-4 w-4"/> Add Stock
                        </Button>
                        <Button className="bg-yellow-600" onClick={() => setEditMode(true)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit Stock
                        </Button>
                    </>
                }
            </CardFooter>
        </Card>
    )
}


