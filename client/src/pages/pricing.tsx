
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Check, X, Crown, Zap, Star } from "lucide-react";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState("intermediario");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: "basico",
      name: "Básico",
      price: 97,
      description: "Ideal para pequenas empresas",
      icon: Zap,
      color: "from-green-500 to-green-600",
      features: [
        "Dashboard básico",
        "2 integrações de API",
        "Relatórios mensais",
        "Suporte por email",
        "Até 1.000 leads/mês",
        "1 usuário"
      ],
      limitations: [
        "Sem automações",
        "Sem relatórios personalizados",
        "Sem suporte prioritário"
      ]
    },
    {
      id: "intermediario",
      name: "Intermediário",
      price: 197,
      description: "Para empresas em crescimento",
      icon: Star,
      color: "from-blue-500 to-blue-600",
      popular: true,
      features: [
        "Dashboard completo",
        "5 integrações de API",
        "Relatórios semanais",
        "Suporte por chat",
        "Até 5.000 leads/mês",
        "3 usuários",
        "Automações básicas",
        "Relatórios personalizados"
      ],
      limitations: [
        "Sem IA avançada",
        "Sem white-label"
      ]
    },
    {
      id: "avancado",
      name: "Avançado",
      price: 397,
      description: "Para grandes empresas",
      icon: Crown,
      color: "from-purple-500 to-purple-600",
      features: [
        "Dashboard premium",
        "Integrações ilimitadas",
        "Relatórios diários",
        "Suporte prioritário 24/7",
        "Leads ilimitados",
        "Usuários ilimitados",
        "Automações avançadas",
        "IA e predições",
        "White-label",
        "API personalizada",
        "Gerente de conta dedicado"
      ],
      limitations: []
    }
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const plan = plans.find(p => p.id === selectedPlan);
      
      toast({
        title: "Pagamento processado!",
        description: `Assinatura do plano ${plan?.name} ativada com sucesso!`,
      });
      
      localStorage.setItem("activePlan", selectedPlan);
      localStorage.setItem("subscriptionActive", "true");
      localStorage.removeItem("trialStarted");
      localStorage.removeItem("trialExpiry");
      
      setLocation("/dashboard");
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

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Continue aproveitando o MarketingHub Pro com um plano que se adapta às suas necessidades
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105'
                    : 'hover:shadow-lg'
                } ${plan.popular ? 'border-blue-500' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-3 opacity-60">
                        <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full ${
                      isSelected
                        ? `bg-gradient-to-r ${plan.color} hover:opacity-90`
                        : ''
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Finalizar assinatura</CardTitle>
              <CardDescription>
                Plano selecionado: <strong>{selectedPlanData?.name}</strong> - R$ {selectedPlanData?.price}/mês
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Forma de pagamento</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="credit_card" id="credit" />
                    <Label htmlFor="credit" className="flex-1 cursor-pointer">
                      Cartão de Crédito (cobrança recorrente)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer">
                      PIX (pagamento mensal manual)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                      Boleto (pagamento mensal manual)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Resumo da assinatura</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Plano {selectedPlanData?.name}</span>
                    <span>R$ {selectedPlanData?.price}/mês</span>
                  </div>
                  <div className="flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>R$ {selectedPlanData?.price}/mês</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
                >
                  {isLoading ? "Processando..." : `Assinar por R$ ${selectedPlanData?.price}/mês`}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    ✅ Cancele quando quiser • ✅ Sem fidelidade • ✅ Suporte incluso
                  </p>
                  <p className="text-xs text-gray-500">
                    Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
