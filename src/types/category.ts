export interface Category {
    id:        string;
    name:      string;
    sortOrder: number;
    deleted:   boolean;
}

export interface CategoryStock {
    id:         string;
    name:       string;
    quantity:   number;
    numOrders:  number;
}