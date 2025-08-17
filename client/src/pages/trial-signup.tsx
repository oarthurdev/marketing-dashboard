
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, Receipt, TrendingUp, Check, ArrowLeft } from "lucide-react";

export default function TrialSignup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    paymentMethod: "credit_card",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    pixKey: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleTrialStart = async () => {
    setIsLoading(true);
    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Teste gratuito ativado!",
        description: "Pagamento de R$ 0,01 processado com sucesso. Seu teste de 7 dias começou!",
      });
      
      localStorage.setItem("trialStarted", "true");
      localStorage.setItem("trialExpiry", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      localStorage.setItem("userEmail", formData.email);
      
      setLocation("/trial-confirmation");
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "credit_card",
      label: "Cartão de Crédito/Débito",
      icon: CreditCard,
      description: "Visa, Mastercard, Elo"
    },
    {
      id: "pix",
      label: "PIX",
      icon: Smartphone,
      description: "Pagamento instantâneo"
    },
    {
      id: "boleto",
      label: "Boleto Bancário",
      icon: Receipt,
      description: "Vencimento em 1 dia útil"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Comece seu teste gratuito
          </h1>
          <p className="text-gray-600">7 dias grátis • Cancele quando quiser • Sem compromisso</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 3 ? <Check className="w-4 h-4" /> : "3"}
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Informações básicas</CardTitle>
                  <CardDescription>Preencha seus dados para começar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa (opcional)</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={() => setLocation("/login")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button onClick={handleNextStep}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Forma de pagamento</CardTitle>
                  <CardDescription>
                    Escolha como deseja validar seu meio de pagamento (cobrança de R$ 0,01)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange("paymentMethod", value)}
                  >
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <Label
                          key={method.id}
                          htmlFor={method.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Icon className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">{method.label}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </Label>
                      );
                    })}
                  </RadioGroup>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button onClick={handleNextStep}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Confirmação de pagamento</CardTitle>
                  <CardDescription>
                    {formData.paymentMethod === "credit_card" && "Insira os dados do seu cartão"}
                    {formData.paymentMethod === "pix" && "Confirme seu PIX"}
                    {formData.paymentMethod === "boleto" && "Confirme os dados para gerar o boleto"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.paymentMethod === "credit_card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do cartão</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Nome no cartão</Label>
                        <Input
                          id="cardName"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange("cardName", e.target.value)}
                          placeholder="Nome como impresso no cartão"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">Validade</Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange("cardExpiry", e.target.value)}
                            placeholder="MM/AA"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardCvv">CVV</Label>
                          <Input
                            id="cardCvv"
                            value={formData.cardCvv}
                            onChange={(e) => handleInputChange("cardCvv", e.target.value)}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "pix" && (
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">PIX - R$ 0,01</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Após clicar em "Confirmar", você receberá o código PIX para pagamento
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "boleto" && (
                    <div className="text-center space-y-4">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">Boleto Bancário - R$ 0,01</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          O boleto será gerado com vencimento para hoje
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-yellow-600 text-sm">ℹ️</div>
                      <div className="text-sm text-yellow-800">
                        <strong>Importante:</strong> Será cobrado R$ 0,01 para validar seu meio de pagamento. 
                        Este valor não será devolvido e serve apenas para verificação.
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleTrialStart}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {isLoading ? "Processando..." : "Confirmar e iniciar teste"}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          <div className="text-center mt-6 text-sm text-gray-600">
            <p>
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a> e{" "}
              <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
