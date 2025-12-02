class UnidadCurricularEntity {
    private nombreUnidadCurricular: string = "";

    constructor(nombre: string) {
        this.setNombreUnidadCurricular(nombre);
    }

    public setNombreUnidadCurricular(nombre: string): void {
        this.nombreUnidadCurricular = nombre;
    }

    // You might also want a getter method
    public getNombreUnidadCurricular(): string {
        return this.nombreUnidadCurricular;
    }
}